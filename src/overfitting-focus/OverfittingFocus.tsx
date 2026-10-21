import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { models, mse, testPoints, trainPoints } from "../overfitting/data";
import {
  Axes,
  CARD_H,
  CARD_W,
  Caption,
  clamp,
  Dot,
  ease,
  PAD,
  pathFrom,
  Pill,
  PLOT_H,
  PLOT_TOP,
  PLOT_W,
  progress,
  sx,
  sy,
} from "../overfitting/Overfitting";
import { COLORS, FONT } from "../theme";

/*
 * The overfitting section of the original explainer, timed to:
 *   "Here's another interesting concept, overfitting.
 *    It's when a model learns its training data so well
 *    that it struggles with anything unfamiliar."
 *
 * Each beat is the second in your voiceover where that phrase starts.
 * Nudge them in the Studio sidebar until the graphic lands on your words.
 */
export type OverfittingFocusProps = {
  position: "left" | "center" | "right";
  showBackground: boolean;
  beats: {
    /** "Here's another interesting concept" – card, axes and training data appear */
    concept: number;
    /** "overfitting." – title */
    title: number;
    /** "It's when a model learns its training data so well" – curve hits every point */
    learns: number;
    /** "that it struggles with anything unfamiliar." – new data, misses, error bars */
    struggles: number;
    /** When the graphic should start leaving */
    out: number;
  };
};

export const overfittingFocusDefaults: OverfittingFocusProps = {
  position: "right",
  showBackground: false,
  beats: { concept: 0.2, title: 1.9, learns: 3.2, struggles: 6.4, out: 10.2 },
};

const EXIT_SECONDS = 0.6;

export const calculateFocusMetadata: CalculateMetadataFunction<OverfittingFocusProps> = ({ props }) => ({
  durationInFrames: Math.ceil((props.beats.out + EXIT_SECONDS) * 30),
});

const ErrorBars: React.FC<{ frame: number; trainAt: number; testAt: number }> = ({ frame, trainAt, testAt }) => {
  const trainErr = mse(models.overfit, trainPoints);
  const testErr = mse(models.overfit, testPoints);
  const maxW = PLOT_W - 300;
  const rows = [
    { label: "Training error", value: trainErr, color: COLORS.train, start: trainAt },
    { label: "Test error", value: testErr, color: COLORS.test, start: testAt },
  ];
  return (
    <div style={{ position: "absolute", left: PAD, top: PLOT_TOP + PLOT_H + 62, width: PLOT_W }}>
      {rows.map((r) => {
        const appear = progress(frame, r.start, 15);
        const grow = progress(frame, r.start + 8, 35);
        return (
          <div key={r.label} style={{ display: "flex", alignItems: "center", height: 52, opacity: appear }}>
            <div style={{ width: 210, fontSize: 24, color: COLORS.muted }}>{r.label}</div>
            <div
              style={{
                height: 22,
                width: Math.max(6, (maxW * r.value * grow) / testErr),
                background: r.color,
                borderRadius: 11,
              }}
            />
            <div style={{ marginLeft: 16, fontSize: 24, fontWeight: 700, color: r.color }}>
              {(r.value * grow).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const OverfittingFocus: React.FC<OverfittingFocusProps> = ({ position, showBackground, beats }) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const f = (seconds: number) => Math.round(seconds * fps);
  const B = {
    concept: f(beats.concept),
    title: f(beats.title),
    learns: f(beats.learns),
    struggles: f(beats.struggles),
    end: durationInFrames,
  };

  // Card in / out
  const enter = spring({ frame: frame - B.concept, fps, config: { damping: 16 } });
  const exit = interpolate(frame, [B.end - f(EXIT_SECONDS), B.end], [0, 1], { ...clamp, easing: ease });
  const scale = (0.92 + 0.08 * enter) * (1 - 0.06 * exit);
  const opacity = Math.min(enter, 1 - exit);
  const margin = 80;
  const left =
    position === "left" ? margin : position === "right" ? width - CARD_W - margin : (width - CARD_W) / 2;

  // Title
  const titleIn = spring({ frame: frame - B.title, fps, config: { damping: 13, stiffness: 140 } });

  // The overfit curve draws left to right through every training point
  const draw = interpolate(frame, [B.learns + 6, B.learns + 66], [0, 1], { ...clamp, easing: ease });
  const samples = 400;
  const curve: [number, number][] = [];
  for (let i = 0; i <= samples * draw; i++) {
    const x = i / samples;
    curve.push([sx(x), sy(models.overfit(x))]);
  }

  const errGrow = progress(frame, B.struggles + 30, 40);
  const legendOpacity = progress(frame, B.struggles, 20);

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        background: showBackground ? "radial-gradient(circle at 30% 30%, #2a3350, #0b0e17)" : "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          left,
          top: 90,
          width: CARD_W,
          height: CARD_H,
          opacity,
          transform: `scale(${scale})`,
          background: COLORS.card,
          border: `2px solid ${COLORS.cardBorder}`,
          borderRadius: 36,
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ position: "absolute", left: PAD, top: PAD - 4, width: PLOT_W, height: 140 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: COLORS.text,
              letterSpacing: -1,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 20}px)`,
            }}
          >
            Overfitting
          </div>
          <Pill frame={frame} from={B.title + 8} to={B.end} color={COLORS.overfit} label="Overfit" />
          <div style={{ position: "absolute", top: 90, left: 0, width: "100%" }}>
            <Caption frame={frame} from={B.learns} to={B.struggles}>
              It learns its training data <span style={{ color: COLORS.text }}>too</span> well…
            </Caption>
            <Caption frame={frame} from={B.struggles} to={B.end + 10}>
              …so it struggles with anything unfamiliar
            </Caption>
          </div>
        </div>

        <svg
          width={PLOT_W}
          height={PLOT_H + 60}
          style={{ position: "absolute", left: PAD, top: PLOT_TOP, overflow: "visible" }}
          fontFamily={FONT}
        >
          <Axes frame={frame} start={B.concept + 10} xLabel="input" yLabel="output" />
          <defs>
            <clipPath id="focus-plot-clip">
              <rect x={0} y={0} width={PLOT_W} height={PLOT_H} />
            </clipPath>
          </defs>

          {/* Error lines from new data to the curve */}
          {testPoints.map((p, i) => {
            const yCurve = sy(models.overfit(p.x));
            const yPoint = sy(p.y);
            return (
              <line
                key={i}
                x1={sx(p.x)}
                x2={sx(p.x)}
                y1={yPoint}
                y2={yPoint + (yCurve - yPoint) * errGrow}
                stroke={COLORS.test}
                strokeWidth={3}
                strokeDasharray="8 7"
                opacity={0.85}
                clipPath="url(#focus-plot-clip)"
              />
            );
          })}

          <g clipPath="url(#focus-plot-clip)">
            <path
              d={pathFrom(curve)}
              fill="none"
              stroke={COLORS.overfit}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 10px ${COLORS.overfit}88)` }}
            />
          </g>

          {trainPoints.map((p, i) => {
            // Each dot pulses as the curve passes through it
            const hit = interpolate(draw, [p.x - 0.02, p.x, p.x + 0.06], [0, 1, 0], clamp);
            return (
              <g key={i}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={11 + 14 * hit} fill={COLORS.train} opacity={0.35 * hit} />
                <Dot p={p} frame={frame} start={B.concept + 25 + i * 3} color={COLORS.train} />
              </g>
            );
          })}
          {testPoints.map((p, i) => (
            <Dot key={i} p={p} frame={frame} start={B.struggles + i * 3} color={COLORS.test} hollow />
          ))}

          <g opacity={legendOpacity} transform={`translate(${PLOT_W - 300}, 26)`}>
            <rect x={-14} y={-22} width={262} height={84} rx={14} fill="rgba(12,16,28,0.92)" />
            <circle cx={10} cy={0} r={9} fill={COLORS.train} />
            <text x={30} y={8} fill={COLORS.text} fontSize={22}>
              Training data
            </text>
            <circle cx={10} cy={38} r={8} fill="none" stroke={COLORS.test} strokeWidth={4} />
            <text x={30} y={46} fill={COLORS.text} fontSize={22}>
              New, unseen data
            </text>
          </g>
        </svg>

        <ErrorBars frame={frame} trainAt={B.learns + 66} testAt={B.struggles + 45} />
      </div>
    </AbsoluteFill>
  );
};
