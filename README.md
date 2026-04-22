# MoodRun

MoodRun is a human-centric running companion prototype focused on emotional support rather than performance pressure. This refactor keeps the original retro arcade visual style and screen flow, but separates the code into beginner-friendly front-end files.

## Project Structure

```text
MoodRun/
├── index.html                  # Main single-page app markup and screen sections
├── css/
│   └── styles.css              # Extracted visual design, layout, animations, responsive CSS
├── js/
│   ├── app.js                  # App coordinator and existing app.* button API
│   ├── data.js                 # Mood plans, wisdom quotes, checkpoint text, pace copy
│   ├── effects.js              # Cursor glow, celebrations, fireworks, breathing timer
│   ├── router.js               # Screen switching and bottom nav active state
│   ├── runTracker.js           # Running simulation, run display formatting, run records
│   └── storage.js              # localStorage helpers for run history
├── pages/
│   └── README.md               # Notes about the current single-page screen approach
├── assets/
│   └── .gitkeep                # Placeholder for future images, sounds, icons, etc.
└── frontend_ver1(1).html        # Original prototype kept as a legacy reference
```

## Current Screens

The app currently uses one lightweight `index.html` with separate screen sections:

- Home / Landing
- Mood Check-In
- Run Setup
- Custom Run Plan
- Running Tracking
- Run Summary
- Wisdom Book
- Profile
- Meditation

This is intentionally still a single-page app because the current flow shares temporary state between screens. Moving each screen into a separate HTML page now would make the coursework prototype harder to maintain without adding much benefit.

## How To Run Locally

Because the JavaScript uses ES modules, run the project through a local static server:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/index.html
```

You can also use VS Code Live Server. The same structure is suitable for GitHub Pages or Vercel static deployment.

## What Moved Where

- Embedded CSS from the original HTML moved into `css/styles.css`.
- Embedded app data moved into `js/data.js`.
- localStorage history handling moved into `js/storage.js`.
- Screen navigation moved into `js/router.js`.
- Running simulation and formatting moved into `js/runTracker.js`.
- Visual/timer effects moved into `js/effects.js`.
- The main app state and button-facing methods now live in `js/app.js`.

## Suggested Next Development

- Replace inline `onclick` attributes with event listeners in `js/app.js`.
- Persist custom plans with localStorage.
- Add at least three polished interactive features for the coursework brief.
- Add responsive testing notes for mobile and desktop.
- Add an `ai-logs/` folder with short development logs.
- Add deployment instructions once the hosting choice is final.
