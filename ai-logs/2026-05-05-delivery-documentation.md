# AI Development Log - Delivery Documentation and Requirements Review

Date: 2026-05-05

Tool: OpenAI Codex in ChatGPT

## Purpose

This log records AI-assisted work used to review the MoodRun system against the CPT208 coursework requirements and to prepare repository documentation for Open Topic D-7.

This is an honest technical disclosure log. It should not be used to invent user research, design decisions, evaluation results, or citations that the team did not actually collect.

## Primary Prompts

The user asked Codex to:

- Review the current web system against the CPT208 coursework PDF and identify missing or weak areas.
- Treat the project as Open Topic D-7 rather than a fixed listed topic.
- Complete repository README files.
- Prepare AI usage evidence required for the system repository.

Codex created truthful disclosure notes based on the current session and repository context rather than inventing project evidence.

## AI-Assisted Tasks

- Extracted and summarised the system-related requirements from the coursework brief.
- Inspected the Vue/Vite project structure, routes, state store, run-session features, mood engine, audio assets, deployment workflow, and existing README.
- Checked that `npm run build` completed successfully before documentation edits.
- Identified delivery risks, including missing live links, AMap credential dependency, incomplete custom-plan flow, accessibility gaps, and unverified audio provenance.
- Rewrote the root README for the Open Topic D-7 system repository.
- Added audio README files documenting file inventory, runtime usage, and license-verification responsibilities.
- Added this AI disclosure log.

## Verification Performed

- Project files were inspected with PowerShell and ripgrep.
- The production build command `npm run build` was run before documentation updates and completed successfully.
- The README content was aligned with the actual project stack: Vue 3, Vite, TypeScript, Vue Router, Pinia, AMap, browser Geolocation, Web Speech APIs, and localStorage.

## Human Review Required

The team should verify or update:

- Final deployed system URL after GitHub Pages deployment.
- Portfolio URL in the separate portfolio project.
- Exact audio source URLs, license terms, and access dates.
- Whether the AMap key and security code are configured as repository secrets.
- Any claims about user research, evaluation, personas, or design rationale in the portfolio.

## Ethical Considerations

- AI was used for codebase review and documentation support, not to create primary user data.
- Mood analysis in the app is a lightweight rule-based prototype and should not be described as clinical mental-health assessment.
- Location, mood text, and run history are sensitive data; final documentation should discuss privacy, consent, localStorage limits, and third-party map-service implications.
- Any AI-generated or AI-assisted material used outside this repository should be cited in the relevant deliverable.

## Suggested Citation

[1] OpenAI Codex in ChatGPT, accessed on 2026-05-05, available at https://chatgpt.com/. Used for reviewing the MoodRun system repository against CPT208 coursework requirements and drafting repository documentation.
