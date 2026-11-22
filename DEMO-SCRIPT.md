# PulseFlow demo · 80 seconds

Record on Windows 11 x64 with a working Presage key. Keep the key, desktop notifications and other people out of the recording. First confirm that at least one rate actually becomes stable. Allow as much capture time as needed; an edited wait should be labeled as a time cut.

| Video time | On screen | Narration |
| --- | --- | --- |
| 0–8 s | Open PulseFlow. Show SDK configuration and camera off. Select Get Started. | “PulseFlow lets me observe pulse and breathing from a desktop camera, alongside a one-minute guided exercise.” |
| 8–18 s | Select the camera, open Start monitoring, pause on the disclosure, then Allow Camera. | “I choose when the camera starts. The SDK authenticates with Presage. Optional telemetry is disabled.” |
| 18–32 s | Show the actual preview or camera status, the initial dashes, then a real stable value and chart. Label any time cut. | “SmartSpectra provides these readings. PulseFlow waits for stable samples, and either rate can appear first.” |
| 32–42 s | Briefly show src/capture.ts with the requested metrics and src/measurements.ts filtering stable samples. Keep credentials off screen. | “The native SDK owns the camera. Its metric packets are decoded and checked before any point reaches the graph.” |
| 42–54 s | Start the guide. Show the circle expanding and contracting. | “This rhythm uses four seconds in and six seconds out. It is a guide I control independently of the readings.” |
| 54–65 s | Pause, hold long enough to see the timer and circle freeze, then resume. | “Pausing holds the phase and excludes incoming samples from the exercise summary.” |
| 65–75 s | End Session. Show actual duration, counts and available averages. | “The summary shows what was observed while the guide was running, with a count for each signal.” |
| 75–80 s | Stop monitoring, then Privacy → Clear session data. | “I can release the camera and clear this session.” |

If the SDK has not produced a valid value, leave the dash visible and repeat the recording after troubleshooting. Avoid inserting example readings or interpreting the summary as a health outcome.
