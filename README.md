# PulseFlow

A Windows desktop workspace for observing camera-derived pulse and breathing rate alongside a one-minute breathing guide. The guide works with the camera off. PulseFlow is for general wellness.

## Requirements

Use Windows 11 x64, x64 Node.js 24 LTS, npm, a working camera and internet access for Presage authentication. Your API key must have access to pulse and breathing rate. Dependencies are locked in package-lock.json, including Electron 42.11.18 and SmartSpectra 3.5.0. Allow room for the native runtime packages and the Electron download.

## Install and run (PowerShell)

Extract the ZIP, open PowerShell in the extracted PulseFlow directory and run:

```powershell
npm ci
Copy-Item .env.example .env
code .env
```

Set SMARTSPECTRA_API_KEY in the local .env file, save and close the editor. This optional file is plaintext. Keep it private and outside shared folders. An existing process environment variable takes precedence. The project includes only an empty example. Restart after changing the key.

```powershell
npm run dev
```

Development builds the local application and opens Electron. To build, run the checks, then reopen the compiled application:

```powershell
npm run build
npm test
npm start
```

The build emits JavaScript, local fonts, HTML, CSS and icons into build/. It requires the installed npm dependencies at runtime. This is a source delivery, without a standalone Windows installer. If Electron fails to download automatically, run `npx --no-install install-electron` and retry. If Electron exits immediately in an integrated terminal, remove ELECTRON_RUN_AS_NODE from the current PowerShell session.

## First session

1. Select **Get Started**. Inspect SDK configuration and choose a camera. Select **Refresh** to rediscover devices without starting capture.
2. Select **Start monitoring**, read the consent dialog, then choose **Allow Camera**. **Not Now** leaves capture off. Monitoring and the exercise have separate controls.
3. Face the camera in even light, keep the upper torso in view and wait for stable samples. A dash means that channel has no current accepted result. The SDK can publish the two channels at different times.
4. Choose inhale and exhale durations (1–15 whole seconds each) and select **Start**. The default is 4 seconds in and 6 seconds out. **Pause** freezes both phase and elapsed time. **Resume** continues from the same point. Active exercise time is capped at 60 seconds.
5. **End Session** finishes the exercise and opens its summary. Monitoring can continue independently. **Stop monitoring** releases the camera. **Privacy → Clear session data** stops capture and clears both histories, the preview, exercise and summary.

## Architecture and measurement contract

| Area | Responsibility |
| --- | --- |
| src/main.ts, src/preload.ts, src/model.ts | Isolated Electron window, trusted-frame checks, allowlisted IPC and typed payloads |
| src/capture.ts, src/camera.ts | Main-process SDK ownership, discovery, lifecycle, validation, camera preview and disconnect handling |
| src/measurements.ts, src/errors.ts | Per-channel stable-sample filter, timestamp deduplication and actionable failures |
| ui/app.ts, ui/index.html, ui/style.css | Welcome, consent, dashboard, breathing and summary views |
| ui/session.ts | Monotonic exercise clock, phase and active-session statistics |
| ui/chart.ts, ui/toasts.ts | Bounded rate histories and accessible notifications |
| tests/ | Session logic, protocol decoding, sender isolation and UI interactions |

The official Electron quickstart demonstrates the callback lifecycle and protobuf decoding. PulseFlow instead uses the documented native camera path in the main process so the key stays outside the renderer. Discovery uses SmartSpectraSDK.availableCameras(). After consent the app constructs the SDK, requests PULSE_RATE and BREATHING_RATE, selects the discovered ID with CameraSelection.byId(), and calls start(). The videoOutput callback supplies an optional monochrome preview. The preview is downsampled independently; the SDK operates on its native input. Stop awaits stopAsync() and destroy(). Chromium camera permission is disabled because native capture owns the camera.

For metrics events, the official decoder reads cardio.pulseRate and breathing.rate. Only stable, finite, positive values with a strictly newer timestamp per channel enter the charts. Repeated packets do not increase counts. Validation warnings, unstable updates and five seconds without a fresh valid result clear the applicable live value. Charts retain up to 150 actual observations per channel, with elapsed seconds on the horizontal axis and separate units. Old history remains visible after stopping. Restarting capture clears both charts.

Session averages are arithmetic means of accepted samples **received while the guide is running**. Paused time and samples arriving during a pause are excluded. Delayed SDK batches are attributed by receipt, rather than by inferred capture time. The summary is descriptive and makes no claim about the effect of the exercise.

## Privacy and security

Frames are used by the native SDK on the device. PulseFlow disables optional Presage telemetry with enableTelemetry=false. Presage documents that default telemetry includes session-level diagnostics and can include full device-readiness reports, without raw frames or measured vital values. SDK account authentication still requires a network connection. PulseFlow does not request cloud insights.

The renderer loads local assets with a restrictive content security policy and has no Node access. The preload exposes setup, start, stop and event subscription. The main process verifies the sender and selected device before capture. The application writes no video recordings, screenshots or biometric histories to disk. Electron and the native runtime may maintain operational caches. Clearing the session drops application references to transient data; it does not claim secure erasure of operating-system memory.

## Troubleshooting

| Symptom | Recovery |
| --- | --- |
| Setup required or invalid key | Set SMARTSPECTRA_API_KEY, restart and check the key, credits and metric entitlements in Presage. |
| No devices | Connect a camera, then Refresh. Use the Windows Camera app to check the device, then close it. |
| Camera permission denied or camera busy | Under Windows Settings → Privacy & security → Camera, enable camera access for desktop apps. Close competing capture software and refresh. Windows and some drivers report these cases using the same unavailable-input error. |
| SDK unavailable | Confirm x64 Node with `node -p process.arch`, run npm ci again and check access to npm and the Electron binary download. |
| Waiting for signal | Keep one face centered, reduce movement and improve lighting. A working camera preview alone does not establish a stable measurement. |
| Preview unavailable | The camera driver or SDK may not deliver preview frames. Watch the signal status and sample counts independently. |
| Camera disconnected | Reconnect, refresh the list and start again. The app monitors SDK errors and periodically checks device presence. |
| IPC or capture interruption | Stop, close PulseFlow and reopen it. Check Windows Camera access and the network before retrying. |

## Validation and limits

The build and automated tests were run on Linux x64 with Node 24. The installed native SDK loaded and device discovery returned an empty list. Unit and DOM tests cover consent and cancellation, no-signal display, pause/resume timing, sample rejection, protobuf decoding, duplicate notifications, summaries, clearing data, error messages and IPC isolation. Test fixtures are confined to tests.

A separate headless Chromium walkthrough exercised the renderer, including the exercise, dialog, summary and compact layout. The full Electron window could not launch in the isolated Linux display environment. Windows capture, account authentication, camera preview, native interruption/cleanup and accuracy of real-world results remain unverified.

Before submission, run the application on Windows with a real key. Test denying consent, starting and stopping twice, unplugging the camera, pausing the guide, and clearing data. Record at least one stable live metric in the demo. If no stable reading appears, resolve that before presenting the project as a working live demonstration.

## Primary references

- [SmartSpectra Node.js and Electron SDK](https://smartspectra.presagetech.com/docs/nodejs/)
- [Official Electron quickstart](https://github.com/Presage-Security/SmartSpectra/tree/main/nodejs/samples/electron-quickstart)
- [SDK telemetry and privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/)
- [Presage developer account](https://physiology.presagetech.com/)
