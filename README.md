# MoodRun

MoodRun is the web system for the CPT208 Human-Centric Computing coursework project, Open Topic D-7. It is a mobile-first playful running companion that turns a runner's current mood into a personalised run plan, route setup, live run feedback, and post-run reflection.

The prototype focuses on a human-centric active lifestyle experience: helping casual runners notice their emotional state, choose a route and pace that fits that state, and review how movement changed the mood afterwards.

## Submission Links

- System URL: https://teethy-tang.github.io/CPT208-D7-MoodRun-System/
- Repository URL: https://github.com/Teethy-tang/CPT208-D7-MoodRun-System
- Portfolio URL: https://teethy-tang.github.io/CPT208-D7-MoodRun-Portfolio/

## Coursework Track

- Module: CPT208 Human-Centric Computing
- Group/topic: Open Topic D-7
- System type: interactive web application
- Primary device: mobile web, with responsive desktop support for demonstration
- Main users: young people who feel stressed, emotionally overloaded, or low on motivation to exercise

## Core Playful Features

1. Mood check-in and local mood assistant
   - Users select a mood or write a short reflection.
   - The "Mood AI" feature uses an on-device rule-based classifier to suggest the closest mood. It does not call an external generative AI service.

2. Mood-based run planning
   - Each mood maps to a suggested plan with different distance, pace, and intensity.
   - Users can choose preset plans. The interface also includes a custom-plan entry screen, but final custom-plan wiring should be completed before treating it as a fully supported flow.

3. Route setup and live run feedback
   - Users can set a route with map picking, manual search, or random route generation.
   - During a run, the app shows GPS distance, pace, progress, route guidance, a mood-styled map, music controls, and voice coaching.

4. Reflection and run history
   - The summary page shows distance, pace, duration, and a before/after mood arc.
   - The wisdom page turns the user's pre-run thought into a short reflection.
   - Profile data, avatar choices, map mode, and run history are stored locally.

5. Calm alternative mode
   - Meditation mode provides breathing visuals and ambient sound choices for users who are not ready to start a run.

## Tech Stack

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- AMap Web SDK for map display and geocoding
- Browser Geolocation API
- Web Speech APIs for voice coach and voice commands where supported
- localStorage for prototype data persistence
- GitHub Pages deployment via GitHub Actions

## Data Handling

MoodRun is a front-end prototype. It does not run a custom backend.

- Mood selections, thoughts, profile details, avatar choices, map mode, and run history are stored in `localStorage`.
- GPS is requested only when route setup or live run tracking needs location access.
- AMap is loaded only when map features are used and requires a valid web key.
- Speech synthesis and speech recognition depend on browser support and user permission.
- No account system or remote database is included in this repository.

Because mood text and GPS traces can be sensitive, final coursework discussion should explain the privacy implications and the limits of local browser storage.

Interaction state evidence:

| User input or interaction | Runtime state | Persistence / external dependency |
| --- | --- | --- |
| Mood selection and reflection text | `currentMood`, `currentThought`, `aiSuggestedMood` in `src/app/stores/moodRun.ts` | Kept in app state during the current flow |
| Plan and route choices | `selectedPlan`, `selectedRoute`, `routeDistanceMode` in `src/app/stores/moodRun.ts` | Route map uses AMap only during route setup/running |
| Live run metrics | `runData` and `runSession` in `src/app/stores/moodRun.ts` | GPS comes from the browser Geolocation API; completed runs are saved to localStorage |
| Profile and avatar customisation | `profile`, `avatar`, `avatarDraft` in `src/app/stores/moodRun.ts` | Saved through `src/services/storage/userProfile.ts` and `src/features/profile/avatar.ts` |
| Run history | `runHistory` in `src/app/stores/moodRun.ts` | Saved through `src/services/storage/runHistory.ts` |
| Audio, voice, and map preferences | `musicEnabled`, `voiceEnabled`, `voiceControlEnabled`, `meditationSound`, `runMapMode` | Some preferences are runtime-only; map mode is saved through `src/features/run-session/runMapSettings.ts` |

## Environment Variables

Create `.env.local` from `.env.example` for local map testing:

```bash
VITE_AMAP_KEY=your_amap_web_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
```

For GitHub Pages, add the same values as repository secrets:

- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_CODE`

If these are missing, the non-map pages still build, but route setup and live map features will show map loading errors.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

The app is configured for GitHub Pages under this repository name:

```ts
const githubPagesBase = '/CPT208-D7-MoodRun-System/';
```

The workflow in `.github/workflows/deploy-pages.yml` builds `dist/` and deploys it when `main` is pushed or when the workflow is triggered manually.

## Project Structure

```text
.
|-- ai-logs/
|-- public/
|   |-- audio/
|   |-- app-icon.svg
|   |-- manifest.webmanifest
|   `-- sw.js
|-- src/
|   |-- app/
|   |   |-- router/
|   |   |-- stores/
|   |   |-- controller.ts
|   |   |-- main.ts
|   |   `-- shell.css
|   |-- assets/css/
|   |-- features/
|   |   |-- meditation/
|   |   |-- mood-engine/
|   |   |-- profile/
|   |   |-- run-session/
|   |   `-- voice-assistant/
|   |-- pages/
|   |-- services/
|   |-- types/
|   |-- App.vue
|   `-- main.ts
|-- index.html
|-- package.json
|-- vite.config.ts
`-- README.md
```

## Architecture Notes

- `src/pages/` contains the route-level Vue pages: Home, Mood, Run, Summary, and Profile.
- `src/app/controller.ts` coordinates the current prototype flow and bridges DOM-heavy interaction code with Vue routes.
- `src/app/stores/moodRun.ts` stores shared state with Pinia.
- `src/features/mood-engine/` contains mood plans, mood analysis, and reflection content.
- `src/features/run-session/` contains route setup, GPS tracking, metrics, map rendering, route guidance, and music selection.
- `src/features/voice-assistant/` contains voice scripts and browser speech-command support.
- `src/services/storage/` contains localStorage helpers for profile and run history.
- `src/assets/css/` contains the migrated visual system and mobile-specific layout refinements.

## Accessibility Notes

The prototype includes semantic form controls, visible labels in key input flows, aria labels for icon buttons, reduced-motion checks for some map scrolling behaviour, and responsive mobile layout rules. Remaining improvement areas include converting all clickable card-like elements into fully keyboard-operable controls and documenting browser support limits for speech recognition.

## AI Usage Disclosure

The repository includes `ai-logs/` because the coursework allows substantive AI assistance for the system and requires disclosure when vibe coding or AI-assisted scripting is used.

Current logs:

- `ai-logs/2026-04-22-refactor.md`
- `ai-logs/2026-05-02-map-and-run-tracking.md`
- `ai-logs/2026-05-04-audio-and-voice.md`
- `ai-logs/2026-05-04-mood-profile-and-reflection.md`
- `ai-logs/2026-05-05-delivery-documentation.md`

These logs should be treated as technical disclosure notes for the system repository. Portfolio reflection and final citations are handled in the separate portfolio project.

## Audio and Asset Notes

Audio files are stored in `public/audio/`. See `public/audio/README.md` for the inventory and licensing checklist. Exact source URLs and license confirmations must be verified by the team before final submission.

Visual assets in this repository are mostly code-generated SVG/pixel UI elements and CSS effects. Any external or AI-generated visual assets used in poster, portfolio, or video materials should be cited in those deliverables.

## Known Limitations

- Route setup depends on AMap credentials and network availability.
- Live run tracking depends on HTTPS, GPS permission, and GPS signal quality.
- Voice controls depend on browser support for Web Speech APIs.
- Mood detection is a lightweight local classifier, not a clinical or mental-health assessment.
- Custom plans currently need final integration into the selectable plan list and run target logic.
- localStorage data remains on the user's browser and can be cleared by the browser or user.
