
import {
  SmartSpectraSDK,
  CameraSelection,
  MetricType,
  SmartSpectraLogLevel,
} from "@smartspectra/node-sdk";

import { decodeMetrics } from "@smartspectra/node-sdk/messages";

import { Measurements } from "./measurements.ts";
import { preview, cameras } from "./camera.ts";
import { sdkError } from "./errors.ts";

import type {
  CaptureEvent,
  Channel,
} from "./model.ts";

export { cameras };

// Enable temporary diagnostics.
// Set to false after identifying the problem.
const DEBUG_SMARTSPECTRA = true;

// Prevent excessive console output.
const DEBUG_INTERVAL_MS = 3000;
const PREVIEW_INTERVAL_MS = 150;
const CAMERA_CHECK_INTERVAL_MS = 5000;

export class Capture {
  private sdk: SmartSpectraSDK | null = null;

  private watchdog:
    | ReturnType<typeof setInterval>
    | undefined;

  private draining: Promise<void> = Promise.resolve();

  constructor(
    private emit: (event: CaptureEvent) => void,
  ) {}

  async start(
    id: string,
    key: string,
  ): Promise<void> {
    await this.draining;

    if (this.sdk) {
      throw new Error(
        "Monitoring is already active.",
      );
    }

    if (!cameras().some((camera) => camera.id === id)) {
      throw new Error(
        "Camera disconnected. Refresh the camera list.",
      );
    }

    const sdk = new SmartSpectraSDK({
      apiKey: key,
      enableTelemetry: false,
      enableAccumulatedOutput: false,
      logLevel: SmartSpectraLogLevel.kNone,

      requestedMetrics: [
        MetricType.PULSE_RATE,
        MetricType.BREATHING_RATE,
      ],
    });

    this.sdk = sdk;

    const readings = new Measurements();

    let usable = true;
    let lastFrame = -Infinity;

    let lastMetricsLog = -Infinity;
    let lastValidationLog = -Infinity;
    let lastPreviewLog = -Infinity;

    let metricsEvents = 0;
    let previewEvents = 0;

    let failureStarted = false;

    const debug = (
      event: string,
      details?: Record<string, unknown>,
    ): void => {
      if (!DEBUG_SMARTSPECTRA) return;

      if (details) {
        console.log(`[SmartSpectra] ${event}`, details);
      } else {
        console.log(`[SmartSpectra] ${event}`);
      }
    };

    const fail = (message: string): void => {
      if (this.sdk !== sdk || failureStarted) {
        return;
      }

      failureStarted = true;

      debug("Capture error", {
        message,
      });

      this.emit({
        kind: "error",
        message,
      });

      void this.stop().catch(() => {
        this.emit({
          kind: "error",
          message:
            "Camera cleanup failed. Restart PulseFlow.",
        });
      });
    };

    try {
      debug("Initializing SDK", {
        cameraSelected: true,
        requestedMetrics: [
          "PULSE_RATE",
          "BREATHING_RATE",
        ],
        apiKeyConfigured: Boolean(key),
      });

      /**
       * SDK errors.
       */
      sdk.on("error", (code) => {
        if (this.sdk !== sdk) return;

        debug("SDK error", {
          code,
        });

        fail(sdkError(code));
      });

      /**
       * Processing status.
       */
      sdk.on("processingStatus", (status) => {
        if (this.sdk !== sdk) return;

        debug("Processing status", {
          status,
        });

        if (status === 5) {
          setImmediate(() => {
            fail(
              "Measurement interrupted. Restart monitoring.",
            );
          });
        }
      });

      /**
       * Signal validation.
       *
       * Diagnostic logs are independent of
       * whether the signal is currently usable.
       */
      sdk.on(
        "validationStatus",
        (code, _timestamp, hint) => {
          if (this.sdk !== sdk) return;

          usable = code === 0;

          const now = performance.now();

          if (
            now - lastValidationLog >=
            DEBUG_INTERVAL_MS
          ) {
            lastValidationLog = now;

            debug("Validation", {
              code,
              usable,
              hint: hint || null,
            });
          }

          this.emit({
            kind: "status",
            valid: usable,
            message: usable
              ? "Waiting for signal"
              : hint ||
                "Adjust lighting and center your face.",
          });
        },
      );

      /**
       * Real SmartSpectra metrics.
       *
       * IMPORTANT:
       * Decode metrics before applying the signal
       * validity filter so diagnostic information
       * remains available when usable is false.
       *
       * Invalid signals are NOT displayed.
       */
      sdk.on("metrics", (buffer) => {
        if (this.sdk !== sdk) return;

        metricsEvents++;

        try {
          const metrics = decodeMetrics(buffer);

          const pulsePoints =
            metrics.cardio?.pulseRate ?? [];

          const breathPoints =
            metrics.breathing?.rate ?? [];

          const now = performance.now();

          if (
            now - lastMetricsLog >=
            DEBUG_INTERVAL_MS
          ) {
            lastMetricsLog = now;

            debug("Metrics received", {
              eventsReceived: metricsEvents,
              usable,

              pulseCount: pulsePoints.length,
              breathCount: breathPoints.length,

              lastPulseStable:
                pulsePoints.at(-1)?.stable ?? null,

              lastBreathStable:
                breathPoints.at(-1)?.stable ?? null,
            });
          }

          // Preserve the original quality filter.
          if (!usable) {
            return;
          }

          const pulse = readings.consume(
            "pulse",
            pulsePoints,
          );

          const breath = readings.consume(
            "breath",
            breathPoints,
          );

          const missing: Channel[] = [];

          if (pulse.missing) {
            missing.push("pulse");
          }

          if (breath.missing) {
            missing.push("breath");
          }

          const values = [
            ...pulse.values,
            ...breath.values,
          ];

          this.emit({
            kind: "samples",
            values,
            missing,
          });

          if (
            DEBUG_SMARTSPECTRA &&
            values.length > 0
          ) {
            debug("Accepted measurements", {
              count: values.length,
            });
          }
        } catch (error) {
          debug("Metrics decoding failed", {
            errorType:
              error instanceof Error
                ? error.name
                : "Unknown",
          });

          fail(
            "Unreadable measurement packet. Restart monitoring.",
          );
        }
      });

      /**
       * Camera video output.
       *
       * Preview diagnostics do not modify
       * the native SmartSpectra input.
       */
      sdk.on(
        "videoOutput",
        (
          buffer,
          width,
          height,
          stride,
          format,
        ) => {
          if (this.sdk !== sdk) return;

          previewEvents++;

          const now = performance.now();

          if (
            now - lastPreviewLog >=
            DEBUG_INTERVAL_MS
          ) {
            lastPreviewLog = now;

            debug("Video output", {
              framesReceived: previewEvents,
              width,
              height,
              stride,
              format,
              bufferLength: buffer.length,
            });
          }

          if (
            now - lastFrame <
            PREVIEW_INTERVAL_MS
          ) {
            return;
          }

          lastFrame = now;

          try {
            const frame = preview(
              buffer,
              width,
              height,
              stride,
              format,
            );

            if (frame) {
              this.emit({
                kind: "frame",
                ...frame,
              });
            }
          } catch {
            // A preview error should not interrupt
            // physiological measurements.
            debug("Preview conversion skipped");
          }
        },
      );

      /**
       * Camera configuration.
       *
       * Preserve the original Work configuration.
       */
      sdk.useCamera(
        CameraSelection.byId(id),
        {
          width: 1280,
          height: 720,
          fps: 30,
        },
      );

      sdk.start();

      debug("SDK start requested");

      /**
       * Watchdog for camera disconnection.
       */
      this.watchdog = setInterval(() => {
        if (this.sdk !== sdk) return;

        try {
          if (
            !cameras().some(
              (camera) => camera.id === id,
            )
          ) {
            fail(
              "Camera disconnected. Reconnect it and refresh the camera list.",
            );
          }
        } catch {
          fail(
            "Camera access interrupted. Check Windows camera access and retry.",
          );
        }
      }, CAMERA_CHECK_INTERVAL_MS);
    } catch (error) {
      try {
        await this.stop();
      } catch {
        // The native SDK may have already
        // released the camera resources.
      }

      const errorCode = (
        error as { code?: unknown }
      )?.code;

      if (errorCode !== undefined) {
        throw new Error(sdkError(errorCode));
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        "Unable to initialize SmartSpectra.",
      );
    }
  }

  /**
   * Stop monitoring and release native resources.
   */
  stop(): Promise<void> {
    const sdk = this.sdk;

    if (!sdk) {
      return this.draining;
    }

    this.sdk = null;

    clearInterval(this.watchdog);
    this.watchdog = undefined;

    if (DEBUG_SMARTSPECTRA) {
      console.log(
        "[SmartSpectra] Stopping monitoring",
      );
    }

    const cleanup = (async () => {
      try {
        await sdk.stopAsync();
      } finally {
        await sdk.destroy();
      }
    })();

    this.draining = cleanup.catch(() => {});

    return cleanup;
  }
}
