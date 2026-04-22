# MoodRun

MoodRun is a human-centric running companion web app. It helps runners choose a run based on their current mood, complete a playful simulated run, review their effort, and reflect with a short wisdom message afterwards.

The project is designed as a lightweight front-end prototype for the CPT208 coursework System Development requirement.

## Live System

- Live URL: TODO - add the GitHub Pages or Vercel URL after deployment
- Source code repository: TODO - add the group GitHub repository URL

## Core Feature Set

The current prototype already supports these must-have interactive features:

1. Mood check-in: users select an emotional state and optionally write down what is on their mind.
2. Mood-based run recommendation: the app suggests a run plan based on the selected mood.
3. Running simulation: distance, pace, duration, calories, progress, route marker, music toggle, and celebration messages update during the run.
4. Run summary and wisdom book: users see a post-run summary and reveal a reflection quote.
5. Profile and history: completed runs are saved with localStorage and displayed in the profile screen.
6. Meditation mode: users can follow a breathing rhythm and select simple ambient sound categories.

## Responsive Design

The interface is built as a mobile-first single-page web app with retro arcade styling. The CSS includes responsive rules for smaller screens and keeps the main interaction flow usable on mobile and desktop browsers.

## Technologies Used

- HTML5
- CSS3
- JavaScript ES Modules
- localStorage for browser-side run history
- Python static server for local development
- GitHub Pages or Vercel for planned deployment

No heavy framework is used at this stage. This keeps the prototype easy for the coursework team to understand, maintain, and deploy.

## Project Structure

```text
MoodRun/
+-- index.html             # Main single-page app markup and screen sections
+-- README.md              # Setup, architecture, features, and coursework notes
+-- ai-logs/               # Primary AI prompts and development logs
|   +-- 2026-04-22-refactor.md
+-- assets/                # Future images, sounds, icons, or other media
|   +-- .gitkeep
+-- css/
|   +-- styles.css         # Visual design, layout, animations, responsive rules
+-- js/
    +-- app.js             # App state coordinator and screen action methods
    +-- data.js            # Mood plans, quotes, checkpoints, and copy data
    +-- effects.js         # Cursor glow, celebrations, fireworks, breathing timer
    +-- router.js          # Screen switching and bottom navigation state
    +-- runTracker.js      # Run simulation, progress updates, and formatting
    +-- storage.js         # localStorage helpers
```

## App Architecture

MoodRun currently uses one `index.html` file with multiple screen sections. JavaScript switches between these sections, so the app behaves like a small single-page application.

This structure is intentional because the current flow shares temporary state across mood check-in, run setup, tracking, summary, wisdom, profile, and meditation. Splitting the prototype into separate HTML pages too early would make state handling more complex without improving the user experience.

## Data Handling

MoodRun stores completed run history in the browser with `localStorage`.

- `js/storage.js` reads and writes saved runs.
- `js/app.js` coordinates the current mood, thought, selected plan, active run, and profile updates.
- `js/runTracker.js` creates run records after the simulation stops.

The current data is local to the user's browser. There is no server database in this prototype.

## Accessibility And Web Standards

The system uses semantic HTML where practical, responsive CSS, readable contrast within the existing retro visual style, and button-based interaction for the main user flow. Future development should improve keyboard focus states, form labels, and reduced-motion support.

## How To Run Locally

Because the JavaScript uses ES modules, run the project through a local static server:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/index.html
```

You can also use VS Code Live Server.

## Deployment Notes

The app is static and can be deployed to GitHub Pages or Vercel.

For GitHub Pages:

1. Push the repository to GitHub.
2. Open repository Settings.
3. Go to Pages.
4. Deploy from the main branch root folder.
5. Copy the public URL into the Live System section above.

## AI Coding Logs

AI-assisted development logs are stored in `ai-logs/`. These logs record the primary prompts used to generate or refactor core components, as required by the coursework brief.

## Next Development Tasks

- Replace inline `onclick` attributes with JavaScript event listeners.
- Persist custom plans in localStorage.
- Finalise the three required must-have playful features from the requirements list.
- Add the final live URL and GitHub repository URL.
- Test the interface on the target device track, such as mobile or PC.
- Improve accessibility details before final submission.
