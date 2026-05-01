# MoodRun

MoodRun is the Vue 3 coursework version of a playful running companion web app. It keeps the original SPA's mood-to-run flow, retro visual style, and localStorage data format while moving the codebase into a cleaner architecture built with Vite, TypeScript, Vue Router, and Pinia.

## Live Links

- Portfolio URL: `TODO`
- System URL: `TODO`
- Repository URL: `TODO`

## What This Repository Contains

This branch is the cleaned Vue delivery version of the project.

- `main` keeps the original static SPA for reference and rollback.
- This branch keeps only the Vue implementation and coursework materials needed for final submission.
- `ai-logs/` is preserved for AI usage disclosure.

## Core User Flow

MoodRun currently supports:

1. Mood selection with optional user reflection text.
2. Mood-based run plan recommendation and custom plan flow.
3. Simulated run tracking with distance, pace, duration, calories, progress, and route feedback.
4. Post-run summary and wisdom reflection.
5. Profile, avatar, and run history backed by localStorage.
6. Meditation and ambient sound interactions.

## Tech Stack

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- localStorage

## Project Structure

```text
.
|-- ai-logs/
|-- src/
|   |-- app/
|   |   |-- router/
|   |   |-- stores/
|   |   |-- controller.ts
|   |   |-- main.ts
|   |   `-- shell.css
|   |-- assets/
|   |   `-- css/
|   |-- features/
|   |   |-- mood-engine/
|   |   |-- profile/
|   |   `-- run-session/
|   |-- pages/
|   |-- services/
|   |   |-- storage/
|   |   `-- ui/
|   |-- types/
|   |-- App.vue
|   `-- main.ts
|-- index.html
|-- package.json
|-- vite.config.ts
`-- README.md
```

## Architecture Notes

- `src/pages/` holds the high-level route screens: Home, Mood, Run, Summary, and Profile.
- `src/app/controller.ts` is the current migration bridge that preserves original behavior while the app is still being incrementally refined.
- `src/app/stores/` holds shared application state in Pinia.
- `src/features/` contains domain-oriented logic such as avatar generation, mood plan data, and run-session tracking.
- `src/services/storage/` keeps localStorage compatibility with the original app.
- `src/assets/css/styles.css` is the migrated visual system, kept close to the original for parity.

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

Preview the production build locally:

```bash
npm run preview
```

## Deployment

This repository is ready for static deployment.

- GitHub Pages works because Vite uses `base: './'` and the app uses hash routing.
- Vercel also works well for the same build output.
- The recommended release flow is: develop on `vue-migration`, merge the final Vue app into `main`, and let GitHub Actions deploy Pages automatically from `main`.

For GitHub Pages, this repository already includes [deploy-pages.yml](/abs/path/d:/CPT208/MoodRun/CPT208-D7-MoodRun-System/.github/workflows/deploy-pages.yml:1), which builds the app and deploys the generated `dist/` output automatically when `main` is updated.

Recommended repository roles:

- `main`: final release branch that GitHub Pages deploys from.
- `vue-migration`: active development branch for architecture and feature work before merging.

## Coursework Notes

- Keep `ai-logs/` in the final submission because the coursework requires AI-assisted development evidence.
- Add final team details, live URLs, and contribution records before submission.
- If the team later introduces Supabase or Leaflet, those should be added incrementally without breaking the current localStorage-compatible flow.
