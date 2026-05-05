# MoodRun Audio Assets

This folder contains audio used by the MoodRun web prototype.

## Runtime Usage

- Meditation ambience is loaded by `src/features/meditation/ambientAudio.ts`.
- Running playlists are loaded by `src/features/run-session/runningMusic.ts`.
- Audio files are served as static files from `public/audio/` through Vite/GitHub Pages.

## Folder Layout

```text
public/audio/
|-- meditation/
|   |-- forest.mp3
|   |-- ocean.mp3
|   |-- rain.mp3
|   `-- wind.mp3
`-- running/
    `-- playlists/
        |-- fast/
        |-- mixed/
        `-- slow/
```

## Meditation Files

- `meditation/forest.mp3`
- `meditation/ocean.mp3`
- `meditation/rain.mp3`
- `meditation/wind.mp3`

## Running Playlist Files

Fast playlist:

- `running/playlists/fast/kontraa-hype-drill-music-438398.mp3`
- `running/playlists/fast/prettyjohn1-no-copyright-music-498106.mp3`
- `running/playlists/fast/studiokolomna-background-music-483818.mp3`

Mixed playlist:

- `running/playlists/mixed/loksii-no-copyright-music-211881.mp3`
- `running/playlists/mixed/sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3`

Slow playlist:

- `running/playlists/slow/music_for_video-just-relax-11157.mp3`
- `running/playlists/slow/prettyjohn1-background-music-505061.mp3`

## Licensing Checklist

The repository keeps the original filenames for traceability, but exact source URLs and license terms are not stored in the codebase. Before final submission, the team should verify and cite:

- Original source page or creator page for every audio file.
- License type and whether coursework/demo usage is allowed.
- Date accessed.
- Whether attribution is required in the app, portfolio, poster, or video.

Do not claim these files are fully cleared for final submission until that verification has been completed.

## Replacement Guidance

If any file cannot be verified, replace it with a confirmed free-tier or self-recorded asset and update this README with the source, license, and access date.
