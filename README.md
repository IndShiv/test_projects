# Motion graphics

Motion graphics for videos, built with [Remotion](https://www.remotion.dev) (React → video).

## Setup

```bash
npm install
npm run studio   # live preview + timeline scrubbing in the browser
```

## Graphics

### Overfitting (`src/overfitting/`)

A 31-second (1920×1080, 30 fps) overlay explaining overfitting. It sits in a card on one side of
the frame so you can stay on camera beside it.

| Time   | What happens                                                         |
| ------ | -------------------------------------------------------------------- |
| 0–3s   | Card appears, axes draw, training data pops in                      |
| 3–7s   | **Underfit**: a straight line misses the pattern                     |
| 7–11s  | **Good fit**: line morphs into a smooth curve that follows the trend |
| 11–15s | **Overfit**: curve morphs to pass through every point                |
| 15–21s | New (test) data appears; error lines + training vs. test error bars  |
| 21–31s | Error vs. model complexity chart with the "sweet spot"               |

Timings live in the `T` object in `Overfitting.tsx`; captions are the `<Caption>` lines below it.
Props (editable in the Studio sidebar): `position` (`left` / `center` / `right`) and
`showBackground`.

### Rendering

```bash
npm run render:overfitting          # out/overfitting.mov  – ProRes 4444 with alpha (Premiere, Final Cut, Resolve)
npm run render:overfitting:webm     # out/overfitting.webm – VP9 with alpha, small (CapCut, web, OBS)
npm run render:overfitting:preview  # out/overfitting-preview.mp4 – dark background, for checking
```

The `Overfitting` composition has a transparent background: drop the `.mov` or `.webm` on a track
above your footage and it overlays directly.
