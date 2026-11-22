# PulseFlow

### Your body, in real time.

**A privacy-conscious desktop experience for contactless physiological sensing and guided breathing, powered by Presage SmartSpectra SDK.**

PulseFlow is a minimal desktop application that transforms an ordinary webcam into an interactive human-sensing experience. It uses real-time physiological signals to visualize heart rate and breathing rate while offering a guided breathing session with a live session summary.

Built with **Electron, TypeScript, and Presage SmartSpectra SDK**, PulseFlow combines contactless sensing, thoughtful interaction design, and responsible data handling.

**Built for the Presage SmartSpectra SDK Challenge 2026.**

![PulseFlow — Main Interface](docs/assets/hero.png)

---

## Overview

Most people associate physiological monitoring with specialized devices or wearables.

PulseFlow explores a different approach: using a standard webcam and Presage SmartSpectra to make physiological signals visible through an accessible, thoughtfully designed desktop experience.

The application brings together three core capabilities:

- **Contactless sensing:** Estimate physiological signals from a standard camera using SmartSpectra.
- **Real-time visualization:** Observe heart rate and breathing rate through live metrics and historical charts.
- **Guided breathing:** Follow a configurable breathing exercise while reviewing measurements collected during the session.

PulseFlow is designed for general wellness exploration and demonstration purposes, not medical diagnosis or treatment.

---

## Application Preview

### 01 — Welcome Experience

A minimal introduction to PulseFlow, designed around clarity, simplicity, and explicit user choice.

![PulseFlow Welcome Experience](docs/assets/hero.png)

### 02 — Live Physiological Monitoring

The application displays real measurements from SmartSpectra, including heart rate and breathing rate when valid signals are available.

![PulseFlow Live Monitoring](docs/assets/liveoverview.png)

### 03 — Camera Integration

PulseFlow connects to a supported webcam and processes physiological signals through the SmartSpectra SDK.

![PulseFlow Camera Integration](docs/assets/cameraprivacyallow.png)

### 04 — Privacy and Consent

Camera-based monitoring requires explicit user consent. The application presents consent information before beginning capture.

![PulseFlow Privacy](docs/assets/privacy.png)

### 05 — Guided Breathing

A synchronized breathing animation provides configurable inhalation and exhalation phases, with controls for starting, pausing, resuming, and ending a session.

![PulseFlow Guided Breathing](docs/assets/aplicacion funcionando.png)

### 06 — Session Summary

At the end of a session, PulseFlow displays the duration, observed physiological averages, valid sample counts, and completion status.

![PulseFlow Session Summary](docs/assets/resultados.png)

---

## Features

### Real-Time Physiological Monitoring

PulseFlow integrates the official Presage SmartSpectra SDK to obtain physiological measurements from a webcam.

Supported application metrics include:

- Heart rate, displayed in beats per minute (BPM).
- Breathing rate, displayed in breaths per minute.
- Time-based visualization of valid measurements.
- Signal-quality feedback.
- Camera connection and monitoring states.

The interface does not generate artificial physiological readings.

If SmartSpectra cannot provide a valid measurement, PulseFlow displays a waiting or unavailable state instead of presenting fabricated data.

### Guided Breathing Sessions

PulseFlow includes a customizable guided breathing experience.

Users can:

- Start a guided breathing session.
- Configure inhalation and exhalation durations.
- Pause or resume the exercise.
- End an active session.
- Review a session summary.

The animated breathing indicator follows the exercise's timer and remains independent of the physiological measurements.

This separation ensures that guided animation is not mistaken for a live measurement.

### Interactive Dashboard

The dashboard provides a unified view of:

- Current physiological measurements.
- Live monitoring status.
- Historical signal charts.
- Camera selection.
- Guided breathing controls.
- Session results.

### Thoughtful Notifications

A lightweight notification system communicates important application events, including:

- Camera availability.
- SDK and connection errors.
- Session state changes.
- Completed activities.

Notifications are designed to be informative without interrupting the monitoring experience.

### Privacy-Conscious Design

PulseFlow incorporates:

- Explicit camera consent.
- User-controlled monitoring.
- Camera selection.
- Clear signal and error states.
- Temporary session information.
- Controls for ending monitoring and clearing session data.

The application does not require users to create an account.

---

## Design Philosophy

PulseFlow follows a minimal, monochromatic design direction inspired by contemporary developer tools and the Geist design language.

The experience emphasizes:

- Black and white surfaces.
- Clear typography.
- Subtle borders.
- Readable physiological metrics.
- Restrained motion.
- Simple navigation.
- Accessible interaction states.

The goal is to make the interface feel calm, precise, and approachable without unnecessary visual complexity.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Electron | Desktop application runtime |
| Node.js | Native runtime and application services |
| TypeScript | Application logic and type safety |
| Presage SmartSpectra SDK | Contactless physiological sensing |
| Protocol Buffers | Decoding structured SDK measurements |
| HTML & CSS | User interface |
| Native Canvas API | Camera previews and metric visualization |

PulseFlow is designed primarily for Windows desktop environments.

---

## Architecture

PulseFlow separates native hardware access, measurement processing, application state, and presentation.

```text
PulseFlow/
├── src/
│   ├── main.ts
│   ├── capture.ts
│   ├── camera.ts
│   ├── measurements.ts
│   ├── errors.ts
│   └── model.ts
├── ui/
│   ├── index.html
│   ├── app.ts
│   └── style.css
├── tests/
├── docs/
│   └── assets/
├── build.mjs
├── package.json
├── .env.example
└── README.md
```

The key responsibilities are:

**Electron Main Process**

Manages native application operations, SDK lifecycle, and access to desktop functionality.

**SmartSpectra Capture Layer**

Initializes SmartSpectra, selects a camera, receives SDK events, and manages capture resources.

**Measurement Processing**

Decodes SDK measurement messages and validates incoming samples before they are displayed.

**Renderer**

Displays application state, charts, camera previews, breathing animations, and user controls.

**Session Controller**

Manages breathing phase timing, pause/resume behavior, and session summaries.

---

## How SmartSpectra Is Used

SmartSpectra is the core sensing technology behind PulseFlow.

The application uses the official Node.js SDK to initialize a physiological monitoring session through a supported webcam.

The integration follows this sequence:

1. The user grants camera consent.
2. PulseFlow initializes the SmartSpectra SDK.
3. The user selects an available camera.
4. SmartSpectra begins processing camera input.
5. The SDK provides validation and measurement events.
6. PulseFlow decodes incoming measurement messages.
7. Valid physiological readings update the dashboard.
8. Session summaries use accepted measurements collected during the exercise.

### Requested Metrics

PulseFlow requests:

```typescript
requestedMetrics: [
  MetricType.PULSE_RATE,
  MetricType.BREATHING_RATE,
]
```

### Real Measurements, Not Simulations

PulseFlow does not fabricate heart rate or breathing rate values.

Readings are accepted only when they satisfy the application's validation requirements.

If a measurement is unavailable, the interface indicates that it is waiting for a valid signal.

### Signal Quality

Successful measurements depend on suitable conditions, including:

- A visible face and sufficient upper-body framing.
- Adequate lighting.
- Limited movement.
- A supported camera.
- A sufficiently stable camera frame rate.

For reliable operation, use a camera mode capable of sustaining at least 25 FPS, preferably 30 FPS.

---

## Getting Started

### Requirements

- Windows 11 x64 or a compatible Windows desktop environment.
- Node.js 20 or newer, with a version compatible with the installed SDK.
- npm.
- A supported webcam.
- A valid Presage SmartSpectra API key.
- Internet connectivity when required by SmartSpectra services.

### 1. Clone the Repository

```bash
git clone https://github.com/Ezequie1Sc/PulseFlow.git
cd PulseFlow
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Your API Key

Create a local environment file from the provided example.

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure your Presage API key using the environment variable expected by the application:

```dotenv
SMARTSPECTRA_API_KEY=your_presage_api_key
```

Never commit your real API key or `.env` file to a public repository.

### 4. Start the Application

```bash
npm run dev
```

PulseFlow will compile and launch as an Electron desktop application.

### 5. Start Monitoring

1. Read the privacy and consent information.
2. Allow access to your camera.
3. Select the desired camera.
4. Start monitoring.
5. Position your face and upper body within the camera frame.
6. Wait for SmartSpectra to acquire valid physiological signals.
7. Start a guided breathing session if desired.
8. Review the session summary.

---

## Available Commands

| Command | Description |
|---|---|
| `npm ci` | Install locked dependencies |
| `npm run build` | Validate TypeScript and build the application |
| `npm run dev` | Build and launch Electron |
| `npm start` | Launch the application |
| `npm test` | Execute automated tests |

### Run Tests

```bash
npm test
```

The automated tests cover application behavior such as:

- Breathing session timing.
- Pause and resume logic.
- Session summary calculations.
- Measurement decoding and validation.
- Duplicate notification handling.
- Error handling.
- Desktop security controls.
- Consent and data-management interactions.

Automated tests do not replace a real-camera integration test.

---

## Consent and Data Handling

PulseFlow is designed around informed user participation.

### Camera Consent

Users must explicitly authorize camera-based monitoring before physiological sensing begins.

Monitoring can be stopped by the user.

### Camera Processing

The application uses the Presage SmartSpectra SDK to process camera input and estimate physiological measurements.

A camera preview may be displayed within the desktop interface during monitoring.

Users should avoid recording or sharing the preview if they do not wish to reveal their appearance.

### Local Session Data

PulseFlow uses session measurements to update the dashboard and calculate temporary summaries.

The application is designed without a dedicated database or user account system.

### Storage and Retention

The application is intended to avoid persistent storage of camera video and physiological session history.

Temporary session data is used for the active experience and can be cleared through application controls.

### SDK Telemetry and Network Communication

PulseFlow configures the SmartSpectra SDK with telemetry disabled:

```typescript
enableTelemetry: false
```

This application setting does not, by itself, guarantee that the SDK makes no network requests or transmits no information.

Any SDK authentication, connectivity requirements, or other data handling must be assessed according to Presage's official documentation and privacy policies.

### Optional AI Services

PulseFlow does not require an external generative AI service to process physiological measurements or operate its guided breathing experience.

### Responsible Use

PulseFlow is not intended for:

- Medical diagnosis.
- Treatment recommendations.
- Clinical decision-making.
- Emergency monitoring.
- Non-consensual surveillance.
- Covert physiological monitoring.

For information about SmartSpectra's data handling and supported functionality, consult the official Presage documentation.

---

## Troubleshooting

### No Camera Detected

- Check Windows camera permissions.
- Close other applications using the webcam.
- Reconnect the device if necessary.
- Refresh the camera list.

### Waiting for Signal

- Improve lighting.
- Center your face in the frame.
- Include your upper chest when possible.
- Reduce movement.
- Allow sufficient time for valid measurements.
- Verify that your webcam provides an adequate frame rate.

### Frame Rate Too Low

SmartSpectra may reject the camera input if the effective frame rate is below its requirements.

Try a supported 30 FPS camera mode at a lower resolution if necessary.

### Connection Problems

If SmartSpectra reports connectivity errors:

- Check your internet connection.
- Confirm that your API key is correctly configured.
- Verify access to the required Presage services.
- Retry monitoring after connectivity is restored.

### Missing Measurements

The application intentionally rejects invalid or unstable measurements.

Do not replace missing values with fabricated physiological data.

---

## Demo

PulseFlow was built for the **Presage SmartSpectra SDK Challenge 2026**.

The demonstration is intended to show:

1. Application startup.
2. Camera consent.
3. SmartSpectra monitoring.
4. Live heart rate and breathing rate.
5. Guided breathing.
6. Session completion.
7. Measurement-based session summary.

**Demo video:** Add your public or unlisted video link here before submission.

**Challenge submission:** Add your DEV Community article URL here after publishing.

---

## Challenge Information

**Event:** Presage SmartSpectra SDK Challenge 2026

**Organized on:** DEV Community

**Technology:** Presage SmartSpectra SDK

**Project:** PulseFlow

**Submission categories:**

- Best Overall Human-Sensing Experience
- Best Thoughtful Real-World Use

PulseFlow focuses on making contactless physiological sensing accessible through a practical desktop interaction, explicit consent, a clear interface, and user-controlled monitoring.

[Presage SmartSpectra Documentation](https://smartspectra.presagetech.com/docs/nodejs/)

[Official SmartSpectra Repository](https://github.com/Presage-Security/SmartSpectra)

[DEV Community](https://dev.to/)

---

## Future Improvements

Potential future enhancements include:

- An optional privacy mode that hides the camera preview while keeping sensing active.
- Additional user-configurable breathing patterns.
- More detailed signal-quality guidance.
- Improved camera compatibility diagnostics.
- Additional accessibility preferences.
- Support for additional desktop platforms where compatible with the SDK.

These are potential improvements and are not presented as completed features.

---

## Disclaimer

PulseFlow is an experimental wellness and human-sensing application.

Physiological estimates obtained through camera-based sensing may vary with lighting, movement, camera characteristics, and signal quality.

The application is not a medical device and must not be used to diagnose, treat, or monitor medical conditions.

---

## Author

**Ezequiel Salazar**

Computer Systems Engineering Student & Software Developer

GitHub: [@Ezequie1Sc](https://github.com/Ezequie1Sc)

---

**Built for the Presage SmartSpectra SDK Challenge 2026.**

*Your body, in real time.*