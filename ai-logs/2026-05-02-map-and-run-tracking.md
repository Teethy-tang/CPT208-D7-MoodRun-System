# AI Development Log - AMap Route Setup and Live Run Tracking

Date range: 2026-05-02 to 2026-05-04

Tool: AI coding assistant used during system development

## Purpose

This file records the primary AI prompts used to generate and refine the map, route setup, GPS tracking, and run guidance components of MoodRun.

## Core Components Covered

- `src/features/run-session/runMap.ts`
- `src/features/run-session/routeSetupMap.ts`
- `src/features/run-session/coordTransform.ts`
- `src/features/run-session/locationService.ts`
- `src/features/run-session/metricsEngine.ts`
- `src/features/run-session/runTracker.ts`
- `src/features/run-session/runMapSettings.ts`
- `src/pages/RunPage.vue`
- route setup sections in `src/pages/MoodPage.vue`
- route and map coordination in `src/app/controller.ts`

## Primary Prompt 1 - Live Map Integration

Primary prompt:

> We are building MoodRun, a Vue 3 + TypeScript mobile-first web app for CPT208 Open Topic D-7. Please add a live map module for the Running page using the AMap Web SDK because the prototype will be demonstrated in China.
>
> Requirements:
> - Create a reusable AMap loader that reads `VITE_AMAP_KEY` and `VITE_AMAP_SECURITY_CODE` from Vite environment variables.
> - Render the runner's live GPS path as a polyline using accepted browser geolocation points.
> - Convert WGS84 browser GPS coordinates to GCJ-02 before displaying them on AMap.
> - Show the planned route if the user selected one before the run, including start and finish markers.
> - Show the current runner position with a custom pixel-style marker that can reuse the user's avatar design.
> - Show a GPS accuracy circle when the accuracy value is reliable enough.
> - Add a loading/error message layer so the UI says "LIVE MAP LOADING..." or "LIVE MAP UNAVAILABLE" instead of crashing.
> - Keep all styles consistent with the existing retro arcade mobile interface.
> - Clean up map listeners and map instances when the run ends or the page is left.

AI-assisted output used:

- Created a reusable AMap loader using `VITE_AMAP_KEY` and `VITE_AMAP_SECURITY_CODE`.
- Added live map rendering for accepted GPS points.
- Added planned route overlays, start/end markers, current runner marker, and an accuracy circle.
- Added map error messages such as "LIVE MAP UNAVAILABLE".
- Used `import.meta.env.BASE_URL`-compatible static paths and GitHub Pages-safe configuration.

Human verification and adjustment:

- Confirmed the app still builds with `npm run build`.
- Checked that the map logic does not block non-map pages.
- Adjusted CSS and layout so the map fits the mobile running page.

## Primary Prompt 2 - Route Setup Before Running

Primary prompt:

> Add a "Set Your Route" step between plan selection and the live run. The user should be able to define a route in three ways:
>
> - Map pick: click once for the start point and once for the finish point.
> - Manual input: type an address or a longitude/latitude pair for start and finish.
> - Random route: use the current location as the start area and generate a random finish point near the target distance.
>
> Use AMap geocoding and reverse geocoding where possible. Display clear summaries for start, finish, plan distance, route distance, distance difference, and target mode. If the generated route distance differs from the selected plan target by more than about 20%, ask the user whether to keep the plan target or use the actual route distance. The route setup should update central app state and pass the selected route into the run tracker.

AI-assisted output used:

- Added `routeSetupMap.ts` for map picking, manual search, reverse geocoding, random route generation, and route drawing.
- Added route state to the central store and controller.
- Added start/finish summaries, distance comparison, and "use route distance" vs "keep plan target" controls.
- Added route conflict handling when route distance is more than 20% different from the plan target.

Human verification and adjustment:

- Checked the route setup flow from mood selection to plan selection to route setup.
- Reviewed manual coordinate parsing and default location behaviour.
- Confirmed that route setup status messages explain map and permission errors.

## Primary Prompt 3 - GPS Metrics and Filtering

Primary prompt:

> Build the run metrics engine for browser GPS tracking. It should accept raw browser geolocation updates and produce a stable running snapshot for the UI.
>
> Required metrics:
> - elapsed time
> - total distance in kilometres
> - average pace
> - current/live pace using a recent movement window
> - calories estimate
> - remaining distance to target
> - progress percentage
> - current GPS accuracy
> - GPS quality label
> - accepted route point count
>
> Add filtering so the tracker rejects invalid coordinates, inaccurate GPS points, stationary jitter, and impossible speed jumps. The app should continue ticking time even while waiting for a good GPS fix, and it should show useful status messages when permission is denied, GPS is weak, or the browser is not in a secure context.

AI-assisted output used:

- Added `metricsEngine.ts` with accepted-point filtering, accuracy thresholds, jitter filtering, speed filtering, route preview data, and pace calculations.
- Added `locationService.ts` to wrap browser geolocation with secure-context checks, permission errors, and status callbacks.
- Connected metrics snapshots to `runTracker.ts` and the running page UI.

Human verification and adjustment:

- Confirmed TypeScript types for `PositionLike`, `RunSnapshot`, and `TrackingResult`.
- Checked that the app handles denied GPS permission without crashing.
- Reviewed displayed values for distance, pace, time, calories, progress, and GPS quality.

## Primary Prompt 4 - Route Guidance During a Run

Primary prompt:

> Extend the run tracker with route guidance. If the user selected a planned route, compare the current GPS position against the route during the run.
>
> Required behaviour:
> - Warn the runner if they start too far away from the planned start point.
> - Warn the runner if they move too far away from the recommended route line.
> - Hide the warning when the runner is close enough to the route again.
> - Keep the run active even when the user is off route, because MoodRun should support free running and not punish exploration.
> - Show a compact route guidance pill on the running page.
> - Return guidance events that can also be spoken by the voice coach.

AI-assisted output used:

- Added route-distance checks in `runTracker.ts`.
- Added start-point and off-route warnings.
- Added route guidance UI in `RunPage.vue`.
- Added voice-ready route guidance messages for later voice assistant integration.

Human verification and adjustment:

- Reviewed that warnings are advisory and do not stop the run.
- Kept calculations lightweight for the front-end prototype.

## Ethical and Technical Notes

- GPS location is sensitive data. The prototype requests location permission only when route or run tracking features need it.
- The current system stores run history locally rather than uploading it to a backend.
- AMap is a third-party map provider; final project documentation should explain this dependency.
- Map and GPS functions require HTTPS or localhost because browser geolocation needs a secure context.

## Related Commits

- `447432f` Add live run map feature with AMap integration.
- `af8088e` Enhance run map functionality.
- `e68afac` Add route setup functionality.
- `70f3fa3` Add current location marker to route setup map.
- `b70acb6` Implement route guidance feature.
- `aca7458` Add run map mode selection and settings.
