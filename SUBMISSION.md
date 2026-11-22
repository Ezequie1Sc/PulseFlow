---
title: "PulseFlow — Your body, in real time"
published: false
tags: presagechallenge, electron, typescript
---

## Project Title

PulseFlow — Contactless Human-Sensing & Guided Breathing Experience. My intended categories are **Best Overall Human-Sensing Experience** and **Best Thoughtful Real-World Use**. #presagechallenge

## What I Built

PulseFlow is an Electron desktop app that pairs a one-minute breathing guide with a camera-based measurement workspace. You can follow the exercise with the camera off or choose to observe pulse and breathing rate alongside it.

## Inspiration

I wanted the interface to stay quiet when the camera has nothing reliable to report. An empty chart and a clear explanation felt more honest than a decorative waveform.

## How I Used SmartSpectra

PulseFlow discovers native cameras, requests pulse rate and breathing rate, and opens the selected device only after consent. It decodes SmartSpectra's protobuf metrics and checks each sample's stability and timestamp before displaying it. The two values can become available independently.

## Features

- Live measurement cards, rate history and camera preview when the SDK supplies frames.
- Configurable inhale and exhale phases, pause, resume and early finish.
- Session averages alongside their sample counts. A session without accepted readings shows “Not available.”

## Technical Implementation

The Electron main process owns the native SDK and key. A sandboxed renderer receives typed measurement and status events through preload. One monotonic clock controls the guide's phase, circle size and elapsed time. The SDK has its own timing and remains independent of the guide.

## User Experience

The dashboard uses local Geist fonts, a grayscale palette and separate scales for the two rates. Each chart starts empty. When signal quality drops, the current value clears while earlier observations remain available for inspection.

## Consent and Data Handling

Users choose whether to start the camera and can stop it independently of the exercise. PulseFlow disables optional SDK telemetry. Presage authentication still uses the network. The application keeps preview frames and session readings in memory and provides a clear-data control.

## Challenges

A stream of callbacks is not a stream of equally reliable measurements. A repeated timestamp, an unstable point and a missing channel each require different handling. Another challenge was preserving the exact phase of the breathing guide across pauses without starting overlapping timers.

## What I Learned

The sample count gives an average important context. Separating the guide from the measurement pipeline also means a camera failure does not interrupt a user's ability to finish the exercise.

## Demo

[Add the recorded Windows demo URL after verifying live camera output.]

## GitHub Repository

[Add the public repository URL after uploading the reviewed source.]

## Future Improvements

Test a wider range of Windows cameras and improve screen-reader access to individual historical samples. The initial implementation focuses on general wellness and does not interpret readings clinically.
