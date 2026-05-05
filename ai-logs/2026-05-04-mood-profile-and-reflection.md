# AI Development Log - Mood Assistant, Profile, and Reflection Features

Date range: 2026-05-04 to 2026-05-05

Tool: AI coding assistant used during system development

## Purpose

This file records the primary AI prompts used to generate and refine the mood assistant, mood-to-run planning, reflection, profile, avatar, and mobile delivery components of MoodRun.

## Core Components Covered

- `src/features/mood-engine/moodAnalyzer.ts`
- `src/features/mood-engine/data.ts`
- `src/features/mood-engine/wisdomBook.ts`
- `src/features/profile/avatar.ts`
- `src/services/storage/userProfile.ts`
- `src/services/storage/runHistory.ts`
- `src/pages/MoodPage.vue`
- `src/pages/ProfilePage.vue`
- `src/pages/SummaryPage.vue`
- controller integration in `src/app/controller.ts`

## Primary Prompt 1 - Local Mood Assistant

Primary prompt:

> Build a lightweight "Mood AI" assistant for the MoodRun prototype. The app should not require a backend or paid AI API, so the assistant should run locally in the browser and behave like a transparent rule-based mood interpreter.
>
> Requirements:
> - Read a short free-text reflection from the user.
> - Infer the closest mood from MoodRun's mood set: stressed, anxious, tired, angry, sad, bored, excited, happy, or neutral.
> - Use weighted keyword and expression signals rather than external API calls.
> - Return the selected mood, confidence, intensity level, optional secondary mood, reasons, and a supportive response.
> - Include English and Chinese mood terms because the target users may write in either language.
> - Handle negation such as "not happy" or "not stressed" sensibly.
> - Detect crisis-like language and respond by encouraging the user to seek support instead of presenting running as the solution.
> - Integrate the result with the Mood AI page so the user can accept the suggested mood and continue to plan selection.

AI-assisted output used:

- Added `moodAnalyzer.ts` with weighted mood terms, intensity detection, confidence scoring, secondary mood support, and reasons.
- Added crisis-language detection and a high-support response.
- Integrated the analyser into the Mood AI page and the mood selection flow.
- Added UI text showing the suggested mood, confidence, intensity, and reasons.

Human verification and adjustment:

- Reviewed the mood categories against the app's plan data.
- Checked that the assistant is described as local/rule-based rather than external generative AI.
- Kept the crisis response non-clinical and safety-oriented.

## Primary Prompt 2 - Mood Plans and Emotional Feedback

Primary prompt:

> Expand the mood-to-run design logic so each mood has a distinct running experience. MoodRun should feel playful and human-centred, not like a generic fitness timer.
>
> Requirements:
> - Define a recommended run plan for each mood, including name, description, time, distance, intensity, target distance, and pace range.
> - Define visual mood profiles with colours, motion tone, and response copy.
> - Define checkpoint messages that appear during progress milestones.
> - Define after-run mood outcomes such as "LIGHTER", "STEADIER", or "FOCUSED".
> - Connect the data to the mood page, recommended plan card, running checkpoints, summary mood arc, and wisdom/reflection flow.
> - Keep the language supportive and playful while avoiding clinical claims.

AI-assisted output used:

- Expanded `data.ts` with mood plans, mood profiles, checkpoint messages, outcomes, and pace descriptions.
- Connected recommended plan display to the selected mood.
- Added checkpoint and completion feedback in the run tracker/controller flow.
- Added mood outcome display in the summary page.

Human verification and adjustment:

- Checked that each mood has a distinct run rationale.
- Removed earlier calorie analogy emphasis and shifted the summary toward mood arc/reflection.

## Primary Prompt 3 - Wisdom Book Reflection

Primary prompt:

> Add a post-run reflection feature called Wisdom Book. After a run, the user should be able to review the thought they wrote before running and reveal a short reflection that connects movement with mood change.
>
> Requirements:
> - Use local data and deterministic selection; do not call an external AI API.
> - Consider the selected mood, after-run mood outcome, pre-run thought, run distance, and elapsed time.
> - Provide varied reflection entries so repeated runs do not always show the same quote.
> - Make the output short enough for a mobile screen.
> - Keep the tone gentle, motivational, and appropriate for a playful wellbeing prototype.
> - Handle empty thoughts or incomplete run data with safe fallback text.
> - Connect the feature to the Summary page through a "Continue" action.

AI-assisted output used:

- Added `wisdomBook.ts` to select reflection entries from local rule/data combinations.
- Connected Wisdom Book to the summary continuation flow.
- Displayed the user's pre-run thought and a revealable quote on the wisdom page.

Human verification and adjustment:

- Reviewed wording to avoid medical claims.
- Checked that missing thought text has a safe fallback.

## Primary Prompt 4 - Profile Editing and Avatar Studio

Primary prompt:

> Add a lightweight profile and avatar system for MoodRun so the web app feels personal and replayable. The feature should be local-only and suitable for a coursework prototype.
>
> Requirements:
> - Let users edit nickname, age, and running level.
> - Validate and normalise profile values before saving.
> - Store profile data in `localStorage`.
> - Create a pixel avatar studio with predefined options for body, colours, eyes, antenna, arms, feet, and accessory.
> - Generate the avatar as safe SVG from predefined values.
> - Add a randomise button and save action.
> - Show the avatar on the home/profile areas.
> - Show total runs, total distance, and recent run history from local storage.
> - Keep the visual style consistent with MoodRun's retro arcade UI.

AI-assisted output used:

- Added profile form handling and validation through `userProfile.ts`.
- Added avatar configuration, option labels, randomisation, SVG generation, and localStorage persistence in `avatar.ts`.
- Added profile and avatar screens in `ProfilePage.vue`.
- Added run history totals and recent run display.

Human verification and adjustment:

- Checked localStorage compatibility for profile, avatar, and history.
- Reviewed generated SVG structure for safe predefined values.

## Primary Prompt 5 - Mobile and PWA Delivery Support

Primary prompt:

> Improve MoodRun for mobile web demonstration and final system delivery. The app should feel stable on a phone browser as well as in desktop marking demos.
>
> Requirements:
> - Add mobile viewport handling for browser chrome, orientation changes, and on-screen keyboard changes.
> - Add PWA metadata through `manifest.webmanifest`.
> - Add mobile app meta tags in `index.html`.
> - Add an app icon.
> - Register a service worker only in production.
> - Cache the app shell while avoiding problematic audio caching.
> - Refine bottom navigation so it appears on appropriate pages and hides during immersive flows.
> - Keep the app deployable to GitHub Pages through the existing Vite build.

AI-assisted output used:

- Added mobile viewport utilities in `src/services/ui/viewport.ts`.
- Added `manifest.webmanifest`, `app-icon.svg`, and `sw.js`.
- Updated `index.html` with mobile app meta tags.
- Refined bottom navigation visibility and touch layout.

Human verification and adjustment:

- Checked that `npm run build` completes.
- Reviewed mobile layout screenshots during development.

## Ethical and Technical Notes

- The Mood AI feature should be described as a local rule-based classifier, not a clinical mental-health tool.
- Profile and run history are local prototype data, not account-backed records.
- The avatar system uses predefined options to avoid arbitrary HTML/SVG injection.
- Post-run reflections should be framed as motivational prompts rather than professional advice.

## Related Commits

- `85e3f69` Integrate mood analysis functionality.
- `6494dd8` Enhance moodAnalyzer with additional mood signals.
- `ce7949c` Add wisdom entry selection and meditation styles.
- `c790ff4` Add profile editing functionality.
- `529bf3f` Enhance mobile app experience and PWA support.
