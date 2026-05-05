# AI Development Log - Meditation Audio, Running Music, and Voice Support

Date range: 2026-05-04

Tool: AI coding assistant used during system development

## Purpose

This file records the primary AI prompts used to generate and refine the meditation audio, running music, voice coach, and voice command components of MoodRun.

## Core Components Covered

- `src/features/meditation/ambientAudio.ts`
- `src/features/run-session/runningMusic.ts`
- `src/features/voice-assistant/voiceAssistant.ts`
- `src/features/voice-assistant/voiceCommandListener.ts`
- `src/features/voice-assistant/voiceCommands.ts`
- `src/features/voice-assistant/voiceScripts.ts`
- meditation UI in `src/pages/HomePage.vue`
- run controls in `src/pages/RunPage.vue`
- controller integration in `src/app/controller.ts`
- audio files in `public/audio/`

## Primary Prompt 1 - Meditation Mode Audio

Primary prompt:

> Add ambient sound playback to MoodRun's Meditation Mode. The meditation page already has a breathing visual and four sound options: rain, ocean, forest, and wind.
>
> Requirements:
> - Create a reusable meditation audio module using the browser `Audio` API.
> - Load files from `public/audio/meditation`.
> - Resolve paths through `import.meta.env.BASE_URL` so the files work after GitHub Pages deployment.
> - Allow only one ambient sound to be active at a time.
> - Fade audio in and out smoothly when switching sounds, pausing, or leaving the page.
> - Support preload for the selected/default sound.
> - Clamp volume between 0 and 1.
> - Clean up audio elements and timers to avoid multiple loops playing in the background.
> - Update controller state so the UI can highlight the selected/playing sound.

AI-assisted output used:

- Added `ambientAudio.ts` with sound URL mapping, preload support, fade transitions, volume clamping, play/pause/stop cleanup, and browser Audio support checks.
- Integrated meditation audio into the controller through `createMeditationAudio()`.
- Added click handlers for rain, ocean, forest, and wind sound choices.
- Added state fields for selected meditation sound, enabled state, and volume.

Human verification and adjustment:

- Checked that selecting a second sound stops/fades the previous one.
- Checked that leaving Meditation Mode stops ambient playback.
- Confirmed asset paths work with `import.meta.env.BASE_URL`.

## Primary Prompt 2 - Running Music by Pace

Primary prompt:

> Add running music to the active Running page. The music should match the selected plan's target pace and feel like part of the playful running experience.
>
> Requirements:
> - Create a reusable running music module.
> - Organise tracks into `fast`, `mixed`, and `slow` playlists.
> - Choose playlist by the plan's `paceRange`: fast plans use energetic tracks, medium plans use mixed tracks, and slower plans use calmer tracks.
> - Start music when the user starts a run, using the run-start click as the user gesture for browser autoplay rules.
> - Add a music toggle button on the Running page.
> - Support pause, resume, stop, and playlist cleanup.
> - Automatically advance to the next track when the current track ends.
> - If a track fails, try the next track instead of stopping the whole session.
> - Stop music when the run finishes, the user stops the run, or the page changes away from running.

AI-assisted output used:

- Added `runningMusic.ts` with pace-to-playlist selection.
- Added playlist arrays for `fast`, `mixed`, and `slow` tracks.
- Added audio cleanup, pause/resume, playlist cycling, and volume support.
- Connected running music to `startRun()`, `toggleMusic()`, and run cleanup in `controller.ts`.
- Added the running-page music control button and active state.

Human verification and adjustment:

- Checked browser autoplay behaviour by tying playback to the run-start interaction.
- Checked stop/pause behaviour when leaving the run page.
- Confirmed build output includes the public audio paths.

## Primary Prompt 3 - Audio Path and Service Worker Fixes

Primary prompt:

> Fix audio loading for production deployment. MoodRun will be deployed under a GitHub Pages repository path, so static audio references must work both in local Vite dev mode and in the built production app.
>
> Requirements:
> - Replace hard-coded root-relative audio paths with paths based on `import.meta.env.BASE_URL`.
> - Make meditation audio and running playlist audio use the same path strategy.
> - Check the service worker fetch handler so it does not intercept `/audio/` files or requests with `Range` headers.
> - Keep app shell caching for normal pages/assets, but let MP3 files stream normally from the server.
> - Confirm the production build still works after the audio path changes.

AI-assisted output used:

- Updated audio path helpers to use `import.meta.env.BASE_URL`.
- Updated the service worker to avoid handling `/audio/` requests and requests with range headers.
- Confirmed the app shell can still be cached while media is fetched normally.

Human verification and adjustment:

- Confirmed `npm run build` passes after path changes.
- Reviewed generated production output path behaviour for GitHub Pages.

## Primary Prompt 4 - Voice Coach

Primary prompt:

> Add an optional voice coach to Running Mode using browser speech synthesis. The voice should make the prototype feel like a supportive running companion, not just a data dashboard.
>
> Requirements:
> - Create a wrapper around `window.speechSynthesis`.
> - Detect unsupported browsers and update the UI accordingly.
> - Add a voice toggle on the Running page.
> - Speak when the run starts, when progress checkpoints are reached, when the target is complete, when GPS status changes, when route guidance triggers, and when pace feedback is needed.
> - Make the wording adapt to the user's selected mood.
> - Prevent repeated messages from speaking too frequently.
> - Allow urgent messages, such as stop confirmation or major GPS warnings, to interrupt lower-priority speech.
> - Stop speech when the run ends or the page unloads.

AI-assisted output used:

- Added `voiceAssistant.ts` as a wrapper around `speechSynthesis`.
- Added mood-aware voice scripts in `voiceScripts.ts`.
- Added voice toggle state and UI integration.
- Connected voice output to run start, checkpoints, route guidance, pace feedback, and GPS status.

Human verification and adjustment:

- Checked feature detection for unsupported browsers.
- Added toggle state updates so the UI does not promise speech when the browser does not support it.

## Primary Prompt 5 - Voice Commands

Primary prompt:

> Add optional voice commands during a run using browser speech recognition where available. This should make the running interaction more hands-free while still preventing accidental destructive actions.
>
> Requirements:
> - Use `SpeechRecognition` or `webkitSpeechRecognition` with feature detection.
> - Add a microphone/voice-control toggle on the Running page.
> - Parse simple commands for status, distance, pace, time, mute voice, resume voice, and stop run.
> - For "stop run", require a confirmation command before actually ending the run.
> - Provide spoken feedback when voice control is unavailable, starts listening, encounters a warning, or receives a command.
> - Stop listening when the user leaves the running page or when the run is saved.
> - Keep command parsing lightweight and local to the browser.

AI-assisted output used:

- Added `voiceCommandListener.ts` using `SpeechRecognition`/`webkitSpeechRecognition`.
- Added command parsing in `voiceCommands.ts`.
- Added voice control toggle UI and status handling.
- Added a two-step stop confirmation to reduce accidental run termination.

Human verification and adjustment:

- Checked unsupported-browser fallback.
- Reviewed command matching so accidental words do not immediately stop a run.

## Ethical and Technical Notes

- Audio playback is optional and user-controllable.
- Speech recognition may send audio to browser/vendor services depending on the browser implementation; final documentation should mention this limitation.
- Music and ambience assets require source/license verification before final submission.
- Voice coach content should be framed as motivational feedback, not medical or mental-health advice.

## Related Commits

- `e773836` Add meditation audio features.
- `f7bf3be` Add running music feature.
- `082acec` Refine audio handling and service worker cache behaviour.
- `f5a168b` Add voice assistant functionality.
- `43de114` Implement voice control features.
