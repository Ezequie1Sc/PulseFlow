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
import type { CaptureEvent, Channel } from "./model.ts";
export { cameras };
export class Capture {
  private sdk: SmartSpectraSDK | null = null;
  private watchdog: ReturnType<typeof setInterval> | undefined;
  private draining: Promise<void> = Promise.resolve();
  constructor(private emit: (e: CaptureEvent) => void) {}
  async start(id: string, key: string) {
    await this.draining;
    if (this.sdk) throw Error("Monitoring is already active.");
    if (!cameras().some((c) => c.id === id))
      throw Error("Camera disconnected. Refresh the camera list.");
    const sdk = new SmartSpectraSDK({
      apiKey: key,
      enableTelemetry: false,
      enableAccumulatedOutput: false,
      logLevel: SmartSpectraLogLevel.kNone,
      requestedMetrics: [MetricType.PULSE_RATE, MetricType.BREATHING_RATE],
    });
    this.sdk = sdk;
    const readings = new Measurements();
    let usable = true,
      lastFrame = -Infinity;
    const fail = (message: string) => {
      if (this.sdk !== sdk) return;
      this.emit({ kind: "error", message });
      void this.stop().catch(() =>
        this.emit({
          kind: "error",
          message: "Camera cleanup failed. Restart PulseFlow.",
        }),
      );
    };
    try {
      sdk.on("error", (code) => fail(sdkError(code)));
      sdk.on("processingStatus", (status) => {
        if (this.sdk === sdk && status === 5)
          setImmediate(() =>
            fail("Measurement interrupted. Restart monitoring."),
          );
      });
      sdk.on("validationStatus", (code, _ts, hint) => {
        if (this.sdk !== sdk) return;
        usable = code === 0;
        this.emit({
          kind: "status",
          valid: usable,
          message: usable
            ? "Waiting for signal"
            : hint || "Adjust lighting and center your face.",
        });
      });
      sdk.on("metrics", (buf) => {
        if (this.sdk !== sdk || !usable) return;
        try {
          const m = decodeMetrics(buf);
          const pulse = readings.consume("pulse", m.cardio?.pulseRate ?? []);
          const breath = readings.consume("breath", m.breathing?.rate ?? []);
          const missing: Channel[] = [];
          if (pulse.missing) missing.push("pulse");
          if (breath.missing) missing.push("breath");
          this.emit({
            kind: "samples",
            values: [...pulse.values, ...breath.values],
            missing,
          });
        } catch {
          fail("Unreadable measurement packet. Restart monitoring.");
        }
      });
      sdk.on("videoOutput", (buf, w, h, stride, format) => {
        if (this.sdk !== sdk || performance.now() - lastFrame < 150) return;
        lastFrame = performance.now();
        const frame = preview(buf, w, h, stride, format);
        if (frame) this.emit({ kind: "frame", ...frame });
      });
      sdk.useCamera(CameraSelection.byId(id), {
        width: 1280,
        height: 720,
        fps: 30,
      });
      sdk.start();
      this.watchdog = setInterval(() => {
        if (this.sdk !== sdk) return;
        try {
          if (!cameras().some((c) => c.id === id))
            fail(
              "Camera disconnected. Reconnect it and refresh the camera list.",
            );
        } catch {
          fail(
            "Camera access interrupted. Check Windows camera access and retry.",
          );
        }
      }, 5000);
    } catch (e) {
      try {
        await this.stop();
      } catch {
        /* A failed initialization may already have stopped its native session. */
      }
      throw Error(sdkError((e as { code?: unknown }).code));
    }
  }
  stop(): Promise<void> {
    const sdk = this.sdk;
    if (!sdk) return this.draining;
    this.sdk = null;
    clearInterval(this.watchdog);
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
