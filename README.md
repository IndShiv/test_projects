# Motion graphics

Motion graphics for videos, built with [Remotion](https://www.remotion.dev) (React → video).

## Setup

```bash
npm install
npm run studio   # live preview + timeline scrubbing in the browser
```

## Graphics

### Iteration (`src/iteration/`)

A ~23-second overlay in the same style, timed to:

> "When we train an AI model and it makes a mistake, we don't immediately throw it away. We look at
> what went wrong. We adjust. We try again. We call that iteration. And yet, when we make mistakes
> in our own lives, we sometimes treat them as evidence that we're not good enough."

| Beat (default)        | You say                                    | On screen                                                       |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `mistake` 0.2s        | "When we train an AI model…"               | "Training a model": dots, a curve that gets it backwards, MISTAKE |
| `notThrownAway` 3.4s  | "we don't immediately throw it away."      | Crossed-out bin                                                 |
| `look` 6.0s           | "We look at what went wrong."              | Error lines, Look → Adjust → Try again chips, error bar         |
| `adjust` 8.2s         | "We adjust."                               | Curve moves closer to the data                                  |
| `tryAgain` 9.4s       | "We try again."                            | Attempt counter; the loop runs, error shrinks, curve turns green |
| `iteration` 11.4s     | "We call that iteration."                  | Title becomes **Iteration**, all steps light up                 |
| `ourLives` 14.0s      | "And yet, when we make mistakes…"          | AI model: Mistake → Iterate; Us: Mistake…                       |
| `evidence` 17.4s      | "we sometimes treat them as evidence"      | Caption                                                         |
| `notGoodEnough` 19.4s | "that we're not good enough."              | …→ Not good enough                                              |
| `out` 22.4s           | (end)                                      | Card fades out                                                  |

```bash
npm run render:iteration          # out/iteration.mov  – ProRes 4444 with alpha (DaVinci Resolve)
npm run render:iteration:webm     # out/iteration.webm – VP9 with alpha
npm run render:iteration:preview  # out/iteration-preview.mp4
```

### Overfitting focus (`src/overfitting-focus/`)

The overfitting section of the original explainer, on its own and timed to the same spoken line
as the intro below. It uses the original card, title, captions and chart.

| Beat (default)   | You say                                               | On screen                                                       |
| ---------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| `concept` 0.2s   | "Here's another interesting concept…"                 | Card appears, axes draw, training dots pop in                   |
| `title` 1.9s     | "…overfitting."                                       | **Overfitting** title + OVERFIT pill                            |
| `learns` 3.2s    | "It's when a model learns its training data so well…" | Curve snakes through every dot; training error 0.00             |
| `struggles` 6.4s | "…that it struggles with anything unfamiliar."        | New data appears, error lines to the curve, test error bar grows |
| `out` 10.2s      | (end of line)                                         | Card fades out                                                  |

Edit `beats` in the Studio props panel to match your recording.

```bash
npm run render:focus          # out/overfitting-focus.mov  – ProRes 4444 with alpha
npm run render:focus:webm     # out/overfitting-focus.webm – VP9 with alpha
npm run render:focus:preview  # out/overfitting-focus-preview.mp4
```

### Overfitting intro (`src/overfitting-intro/`)

An ~11-second overlay timed to the line:

> "Here's another interesting concept, overfitting. It's when a model learns its training data so
> well that it struggles with anything unfamiliar."

| Beat (default) | You say                                               | On screen                                                        |
| -------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `concept` 0.2s | "Here's another interesting concept…"                 | Card slides in: **NEW CONCEPT**                                  |
| `title` 1.9s   | "…overfitting."                                       | **Overfitting** pops in with an underline                        |
| `learns` 3.2s  | "It's when a model learns its training data so well…" | Card grows, dots appear, a curve snakes through every one ✓      |
| `struggles` 6.4s | "…that it struggles with anything unfamiliar."      | A new point drops in, the curve misses it, ✕, card shudders      |
| `out` 10.2s    | (end of line)                                         | Card slides out                                                  |

To sync it to your recording, open `npm run studio`, pick `OverfittingIntro`, and edit the `beats`
(in seconds) in the props panel. Drop your audio into `public/` and add it as an `<Audio>` if you
want to line it up by ear. The video length follows `beats.out` automatically.

```bash
npm run render:intro          # out/overfitting-intro.mov  – ProRes 4444 with alpha
npm run render:intro:webm     # out/overfitting-intro.webm – VP9 with alpha
npm run render:intro:preview  # out/overfitting-intro-preview.mp4
```

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
