# PulseFlow

### Your body, in real time.

**Contactless physiological sensing, real-time visualization, and guided breathing — powered by the Presage SmartSpectra SDK.**

Built for the **[Presage SmartSpectra SDK Challenge 2026](https://dev.to/challenges/presage-2026-11-04)**.

[![Electron](https://img.shields.io/badge/Electron-Desktop-18181B?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-18181B?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![SmartSpectra](https://img.shields.io/badge/Powered%20by-SmartSpectra-18181B?style=flat-square)](https://presagetech.com/)
[![Windows](https://img.shields.io/badge/Platform-Windows%20x64-18181B?style=flat-square)](#requirements)
[![Challenge](https://img.shields.io/badge/DEV-Challenge%202026-18181B?style=flat-square)](https://dev.to/challenges/presage-2026-11-04)

---

![PulseFlow — Main Interface](assets/hero.png)

<p align="center">
  <strong>Real signals. Thoughtful interaction. A simpler way to explore physiological sensing.</strong>
</p>

<p align="center">
  <a href="https://youtu.be/8ztd4aoxduk">Watch Demo</a>
  &nbsp;•&nbsp;
  <a href="https://github.com/Ezequie1Sc/PulseFlow">Source Code</a>
  &nbsp;•&nbsp;
  <a href="https://smartspectra.presagetech.com/docs/nodejs/">SDK Documentation</a>
</p>

---

## Overview

**PulseFlow** is a Windows desktop application that transforms an ordinary webcam into an interactive human-sensing experience.

Using the **Presage SmartSpectra SDK**, the application estimates heart rate and breathing rate without requiring wearable devices or dedicated physiological sensors.

PulseFlow combines live measurements, interactive charts, and guided breathing sessions in a minimal, privacy-conscious desktop interface.

The project explores one central question:

> What if exploring your body's physiological signals could begin with something as familiar as your webcam?

The experience focuses on three principles:

- **Real measurements:** Physiological readings originate from SmartSpectra, not simulated data.
- **Thoughtful interaction:** Live monitoring is complemented by guided breathing and clear session feedback.
- **Consent and transparency:** Camera monitoring requires user participation and clear control over the experience.

PulseFlow is an experimental application for technical demonstration and general wellness exploration. It is **not a medical device**.

---

## Live Demonstration

PulseFlow has been demonstrated using a real webcam and live Presage SmartSpectra measurements.

The video includes physiological monitoring, the guided breathing interface, and a completed session summary.

[![Watch PulseFlow on YouTube](https://img.youtube.com/vi/8ztd4aoxduk/hqdefault.jpg)](https://youtu.be/8ztd4aoxduk)

**[Watch the complete PulseFlow demonstration](https://youtu.be/8ztd4aoxduk)**

The public video uses anonymized camera imagery to protect the participant's privacy while preserving the displayed physiological measurements.

---

## Features

| Feature | Description |
|---|---|
| Contactless sensing | Estimates physiological signals using a webcam and SmartSpectra |
| Heart rate monitoring | Displays valid pulse estimates in BPM |
| Breathing rate monitoring | Displays valid respiratory estimates in breaths per minute |
| Live visualizations | Updates charts with accepted measurements |
| Signal validation | Handles invalid, unavailable, and unstable readings |
| Camera selection | Allows selection of an available capture device |
| Guided breathing | Supports configurable inhalation and exhalation phases |
| Session controls | Start, pause, resume, and end sessions |
| Session summaries | Calculates observed averages and valid sample counts |
| Consent workflow | Requires authorization before camera monitoring |
| Notifications | Provides contextual status and error feedback |
| Error handling | Communicates camera and SDK problems |

---

## Application Showcase

### 01 — The Desktop Experience

PulseFlow uses a minimal monochromatic interface inspired by modern developer tools.

The visual system emphasizes readable typography, clear navigation, subtle borders, and restrained animations.

![PulseFlow — Application Experience](assets/aplicacion%20funcionando.png)

### 02 — Real-Time Physiological Monitoring

The dashboard presents the latest available heart rate and breathing rate estimates alongside historical charts.

![PulseFlow — Live Monitoring](assets/liveoverview.png)

During development, a live monitoring test produced measurements including:

| Signal | Observed Measurement |
|---|---|
| Heart rate | 83.7 BPM |
| Breathing rate | 7.2 breaths/min |

These values are examples from an actual demonstration, not hardcoded measurements or reference targets.

When acceptable physiological data is unavailable, PulseFlow shows an appropriate waiting state.

### 03 — Camera Consent

PulseFlow provides an explicit consent step before initiating camera-based monitoring.

![PulseFlow — Camera Consent](assets/cameraprivacyallow.png)

### 04 — Privacy and Transparency

The application provides information about camera usage and allows users to stop monitoring.

![PulseFlow — Privacy Information](assets/privacy.png)

### 05 — Guided Breathing

PulseFlow includes a guided breathing experience with configurable inhale and exhale intervals.

Users can start, pause, resume, or finish a session while observing available SmartSpectra measurements.

The breathing animation follows the exercise timer independently of the measured breathing rate. It does not simulate or replace physiological readings.

### 06 — Session Results

At the end of a session, PulseFlow summarizes the accepted measurements collected during the exercise.

![PulseFlow — Completed Session](assets/resultados.png)

An example completed 60-second session produced:

| Measurement | Result |
|---|---|
| Duration | 60 seconds |
| Average heart rate | 84.9 BPM |
| Average breathing rate | 8.0 breaths/min |
| Valid heart rate samples | 69 |
| Valid breathing samples | 15 |
| Session status | Completed |

These figures represent one demonstration session and are not evidence of medical or therapeutic benefit.

---

## How SmartSpectra Powers PulseFlow

SmartSpectra is the core technology behind PulseFlow's physiological sensing.

The application integrates the official Node.js SDK to process webcam input and receive live measurement events.

### Processing Architecture

```text
Standard Webcam
       |
       v
Presage SmartSpectra SDK
       |
       +---- Processing Status
       |
       +---- Signal Validation
       |
       +---- Physiological Metrics
       |
       +---- Camera Video Output
       |
       v
Capture Service
src/capture.ts
       |
       v
Measurement Processing
src/measurements.ts
       |
       v
Electron IPC
       |
       v
PulseFlow Interface
       |
       +---- Live Metrics
       +---- Historical Charts
       +---- Guided Breathing
       +---- Session Summaries
```

### Requested Signals

PulseFlow requests two metrics from SmartSpectra:

```typescript
requestedMetrics: [
  MetricType.PULSE_RATE,
  MetricType.BREATHING_RATE,
]
```

### SDK Event Handling

The capture layer handles events including:

| Event | Purpose |
|---|---|
| `processingStatus` | Reports the SDK's processing lifecycle |
| `validationStatus` | Provides signal-quality feedback |
| `metrics` | Supplies physiological measurements |
| `videoOutput` | Supplies camera preview frames |
| `error` | Reports SDK-related errors |

Measurement messages are decoded using the SDK's Protocol Buffers definitions.

### Measurement Integrity

PulseFlow processes incoming measurements before presenting them in the interface.

The application distinguishes between an active camera and a valid physiological signal.

When a valid measurement is unavailable, the application indicates that it is waiting rather than displaying a fabricated reading.

**No synthetic heart rate or breathing rate values are used as substitutes for SmartSpectra measurements.**

---

## Guided Breathing

PulseFlow complements monitoring with a timed breathing exercise.

The session supports:

- Configurable inhalation intervals.
- Configurable exhalation intervals.
- A synchronized breathing indicator.
- Pause and resume functionality.
- Session completion controls.
- Measurement-based summaries.

The exercise timer and animation are separate from SmartSpectra's physiological measurement pipeline.

This distinction helps prevent visual guidance from being mistaken for live physiological activity.

---

## Technology Stack

| Technology | Role |
|---|---|
| Electron | Desktop application runtime |
| Node.js | Native integration and application services |
| TypeScript | Type-safe application logic |
| Presage SmartSpectra SDK | Contactless physiological sensing |
| Protocol Buffers | Decoding SDK measurement messages |
| HTML5 | Interface structure |
| CSS | Styling, layout, and animation |
| Canvas API | Preview and data visualization |
| esbuild | Application bundling |
| Node.js Test Runner | Automated testing |

PulseFlow runs as a desktop application and does not require a separate application backend or dedicated database.

---

## Project Structure

```text
PulseFlow/
├── assets/
│   ├── hero.png
│   ├── aplicacion funcionando.png
│   ├── liveoverview.png
│   ├── cameraprivacyallow.png
│   ├── privacy.png
│   └── resultados.png
├── src/
│   ├── main.ts
│   ├── preload.ts
│   ├── capture.ts
│   ├── camera.ts
│   ├── measurements.ts
│   ├── model.ts
│   └── errors.ts
├── ui/
│   ├── index.html
│   ├── app.ts
│   ├── chart.ts
│   ├── session.ts
│   ├── toasts.ts
│   └── style.css
├── tests/
├── build.mjs
├── tsconfig.json
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

### Main Components

**Electron Main Process — `src/main.ts`**

Manages the desktop application, native operations, and IPC communication.

**Preload Bridge — `src/preload.ts`**

Exposes a restricted interface between the Electron main process and the renderer.

**SmartSpectra Capture — `src/capture.ts`**

Coordinates SDK initialization, camera selection, event handling, and capture lifecycle.

**Camera Processing — `src/camera.ts`**

Handles camera-related operations and preparation of video preview data.

**Measurement Processing — `src/measurements.ts`**

Decodes, validates, and filters incoming physiological measurements.

**Desktop Interface — `ui/app.ts`**

Manages dashboard interactions and the presentation of application state.

**Session Controller — `ui/session.ts`**

Controls guided breathing timing and session progression.

**Notifications — `ui/toasts.ts`**

Displays contextual application notifications.

---

## Getting Started

### Requirements

- Windows 11 x64 or a compatible Windows desktop environment.
- Node.js and npm compatible with the installed SmartSpectra SDK.
- A supported webcam.
- A valid Presage SmartSpectra API key.
- Camera access permissions.
- Network connectivity when required by SmartSpectra.

### 1. Clone the Repository

```bash
git clone https://github.com/Ezequie1Sc/PulseFlow.git
cd PulseFlow
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Your Environment

Copy the provided example environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure your Presage API key:

```dotenv
SMARTSPECTRA_API_KEY=your_presage_api_key
```

Use the environment variable documented in `.env.example` and expected by your installed application version.

**Never commit your real API key.**

The local `.env` file should remain excluded from version control.

### 4. Run PulseFlow

```bash
npm run dev
```

The application builds and launches through Electron.

### 5. Begin Monitoring

1. Launch PulseFlow.
2. Review the camera consent information.
3. Grant permission to begin monitoring.
4. Select an available webcam.
5. Position your face and upper body within the frame.
6. Ensure suitable lighting and minimize movement.
7. Wait for valid physiological measurements.
8. Observe the live dashboard.
9. Start a guided breathing session if desired.
10. Review the session summary.

---

## Development Commands

| Command | Description |
|---|---|
| `npm ci` | Install dependencies using the lockfile |
| `npm run build` | Type-check and build the application |
| `npm run dev` | Build and launch the Electron application |
| `npm start` | Launch the existing application build |
| `npm test` | Run automated tests |

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

The project contains automated tests for functionality such as measurement handling, breathing session logic, notifications, and desktop security behavior.

A successful build is not a substitute for functional testing with a real webcam.

**Test status:** Automated tests should be run against the final submitted commit. A previous version reported a `Window unavailable` failure in one desktop test; the current result must be confirmed rather than assumed.

---

## Consent and Data Handling

PulseFlow is designed around explicit camera consent and user-controlled physiological sensing.

### Camera Consent

Users must grant consent before camera-based monitoring begins.

The application provides controls to stop monitoring and end a session.

### Camera Processing

PulseFlow uses webcam input through the Presage SmartSpectra SDK to obtain physiological estimates.

The desktop application may display the camera frames as a local preview.

Screenshots and demonstration recordings can anonymize the camera preview to protect the participant's identity.

### Physiological Data

Accepted measurements are used for:

- Live numerical indicators.
- Historical charts.
- Guided-session observations.
- Session summary calculations.

### Storage and Retention

PulseFlow does not implement a dedicated persistent database for physiological records or user accounts.

Session measurements are intended for temporary use during the application experience.

Any native SDK caching, logging, network transfer, or provider-side retention must be evaluated separately under Presage's documentation and policies.

### Network Communication and Telemetry

The application configures SmartSpectra with:

```typescript
enableTelemetry: false
```

This disables the configurable telemetry option used by PulseFlow.

It does **not** establish that the SDK performs no authentication requests, network communication, or other provider-side processing.

PulseFlow does not implement a separate backend for uploading physiological session histories.

### Optional AI Services

No separate generative AI service is required for the live physiological measurements or guided breathing experience.

Physiological estimates originate from SmartSpectra.

### Deletion and User Control

The application provides controls for stopping monitoring and managing session state.

It does not implement permanent cloud-based physiological histories.

### Responsible Use

PulseFlow must not be used for:

- Medical diagnosis or treatment.
- Clinical decision-making.
- Emergency monitoring.
- Non-consensual monitoring.
- Covert surveillance.

**PulseFlow is an experimental, non-medical human-sensing application.**

---

## Troubleshooting

### Camera Not Detected

- Verify Windows camera permissions.
- Close other applications using the webcam.
- Check the camera connection.
- Refresh the camera selection.

### Waiting for Signal

- Improve lighting.
- Keep your face visible.
- Include the upper chest where possible.
- Remain relatively still.
- Allow time for signal acquisition.
- Check camera frame rate and resolution.

### Insufficient Frame Rate

SmartSpectra may report insufficient frame rate.

Try a supported capture mode providing at least 25 FPS, preferably 30 FPS. A lower resolution may improve camera performance.

### SmartSpectra Connection Error

- Verify internet access.
- Confirm the API key is correct.
- Check connectivity to required Presage services.
- Restart monitoring after resolving the issue.

### Invalid Measurements

PulseFlow does not fabricate values when SmartSpectra cannot provide acceptable physiological estimates.

The application will continue waiting for a valid signal.

---

## Challenge Submission

PulseFlow was created for the **Presage SmartSpectra SDK Challenge 2026** on DEV Community.

### Prize Categories

**Most Creative or Delightful Use**

PulseFlow brings contactless physiological sensing into a minimal, interactive desktop experience with guided breathing, live charts, and session summaries.

**Best Thoughtful Real-World Use**

PulseFlow explores accessible, voluntary physiological monitoring through an ordinary webcam, with an emphasis on consent, clarity, and responsible data presentation.

### Submission Links

| Resource | Link |
|---|---|
| Source code | [GitHub Repository](https://github.com/Ezequie1Sc/PulseFlow) |
| Video demonstration | [Watch on YouTube](https://youtu.be/8ztd4aoxduk) |
| Challenge | [DEV Community Challenge](https://dev.to/challenges/presage-2026-11-04) |
| SDK documentation | [Presage SmartSpectra](https://smartspectra.presagetech.com/docs/nodejs/) |

---

## Future Improvements

Potential future enhancements include:

- An optional camera preview privacy toggle.
- More configurable guided breathing patterns.
- Detailed signal-quality diagnostics.
- Improved camera compatibility feedback.
- Expanded accessibility settings.
- Additional platform support where compatible with the SDK.

These are future development ideas, not features claimed as completed.

---

## Disclaimer

PulseFlow is an experimental application developed for education, demonstration, and general wellness exploration.

Physiological estimates may vary with lighting, camera characteristics, movement, frame rate, and signal quality.

**PulseFlow is not a medical device and must not be used for diagnosis, treatment, or clinical monitoring.**

---

## Author

**Ezequiel Salazar**

Computer Systems Engineering Student & Software Developer

GitHub: [@Ezequie1Sc](https://github.com/Ezequie1Sc)

---

## Acknowledgments

Built using the [Presage SmartSpectra SDK](https://smartspectra.presagetech.com/docs/nodejs/) for the [Presage SmartSpectra SDK Challenge 2026](https://dev.to/challenges/presage-2026-11-04).

Thanks to Presage and DEV Community for encouraging developers to explore responsible, camera-based human sensing.

---

<p align="center">
  <strong>PulseFlow</strong>
</p>

<p align="center">
  Your body, in real time.
</p>