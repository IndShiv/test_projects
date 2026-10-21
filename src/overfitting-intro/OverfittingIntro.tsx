import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { models, testPoints, trainPoints } from "../overfitting/data";
import { COLORS, FONT } from "../theme";

/*
 * Script:
 *   "Here's another interesting concept, overfitting.
 *    It's when a model learns its training data so well
 *    that it struggles with anything unfamiliar."
 *
 * Each beat is the second in your voiceover where that phrase starts.
 * Nudge them in the Studio sidebar until the graphic lands on your words.
 */
export type OverfittingIntroProps = {
  position: "left" | "right";
  showBackground: boolean;
  beats: {
    /** "Here's another interesting concept" */
    concept: number;
    /** "overfitting." */
    title: number;
    /** "It's when a model learns its training data so well" */
    learns: number;
    /** "that it struggles with anything unfamiliar." */
    struggles: number;
    /** When the graphic should start leaving */
    out: number;
  };
};

export const overfittingIntroDefaults: OverfittingIntroProps = {
  position: "right",
  showBackground: false,
  beats: { concept: 0.2, title: 1.9, learns: 3.2, struggles: 6.4, out: 10.2 },
};

const EXIT_SECONDS = 0.6;

export const calculateIntroMetadata: CalculateMetadataFunction<OverfittingIntroProps> = ({ props }) => ({
  durationInFrames: Math.ceil((props.beats.out + EXIT_SECONDS) * 30),
});

const CARD_W = 780;
const PAD = 44;
const PLOT_W = CARD_W - PAD * 2;
const PLOT_H = 280;
const Y_RANGE = 1.6;
const sx = (x: number) => x * PLOT_W;
const sy = (y: number) => PLOT_H / 2 - (y / Y_RANGE) * (PLOT_H / 2);

const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The unseen point the overfit curve misses the most.
const missPoint = testPoints.reduce((worst, p) =>
    Math.abs(models.overfit(p.x) - p.y) > Math.abs(models.overfit(worst.x) - worst.y) ? p : worst,
  );

const Row: React.FC<{
  frame: number;
  start: number;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}> = ({ frame, start, icon, color, children }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 15 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        height: 56,
        opacity: s,
        transform: `translateX(${(1 - s) * -30}px)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          background: `${color}26`,
          border: `2px solid ${color}`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 32, color: COLORS.text, fontWeight: 500 }}>{children}</div>
    </div>
  );
};

export const OverfittingIntro: React.FC<OverfittingIntroProps> = ({ position, showBackground, beats }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const f = (seconds: number) => Math.round(seconds * fps);

  // Card in / out
  const enter = spring({ frame: frame - f(beats.concept), fps, config: { damping: 16 } });
  const exit = interpolate(frame, [durationInFrames - f(EXIT_SECONDS), durationInFrames], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const slide = position === "right" ? 1 : -1;

  // Title
  const titleIn = spring({ frame: frame - f(beats.title), fps, config: { damping: 12, stiffness: 140 } });
  const underline = interpolate(frame, [f(beats.title) + 6, f(beats.title) + 24], [0, 1], {
    ...clamp,
    easing: ease,
  });

  // Plot: dots, then a curve that snakes through every one of them
  const plotIn = interpolate(frame, [f(beats.learns), f(beats.learns) + 10], [0, 1], clamp);
  const draw = interpolate(frame, [f(beats.learns) + 18, f(beats.learns) + 70], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const samples = 300;
  let d = "";
  for (let i = 0; i <= samples * draw; i++) {
    const x = i / samples;
    d += `${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(models.overfit(x)).toFixed(1)} `;
  }

  // New data: drops in, misses, card shudders
  const s0 = f(beats.struggles);
  const drop = spring({ frame: frame - s0, fps, config: { damping: 10, stiffness: 120 } });
  const miss = interpolate(frame, [s0 + 14, s0 + 30], [0, 1], { ...clamp, easing: ease });
  const shake = interpolate(frame, [s0 + 28, s0 + 46], [1, 0], clamp) * Math.sin((frame - s0) * 1.9) * 7;
  const xMark = spring({ frame: frame - (s0 + 28), fps, config: { damping: 9 } });
  const curveY = Math.min(PLOT_H, Math.max(0, sy(models.overfit(missPoint.x))));
  const pointY = sy(missPoint.y);

  // Card starts compact (title only) and grows when the chart arrives
  const COMPACT_H = 230;
  const FULL_H = 672;
  const cardH = interpolate(frame, [f(beats.learns) - 6, f(beats.learns) + 14], [COMPACT_H, FULL_H], {
    ...clamp,
    easing: ease,
  });

  const cardLeft = position === "right" ? width - CARD_W - 90 : 90;
  const cardTop = height / 2 - 336;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        background: showBackground ? "radial-gradient(circle at 30% 40%, #3a3f55, #101320)" : "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: cardLeft,
          top: cardTop,
          width: CARD_W,
          height: cardH,
          overflow: "hidden",
          padding: PAD,
          boxSizing: "border-box",
          opacity: Math.min(enter, 1 - exit),
          transform: `translateX(${slide * ((1 - enter) * 80 + exit * 60) + shake}px)`,
          background: COLORS.card,
          border: `2px solid ${COLORS.cardBorder}`,
          borderRadius: 32,
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* "Here's another interesting concept" */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            color: COLORS.train,
            textTransform: "uppercase",
            opacity: interpolate(enter, [0.3, 1], [0, 1], clamp),
          }}
        >
          New concept
        </div>

        {/* "overfitting." */}
        <div style={{ position: "relative", height: 96, marginTop: 6 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -2,
              color: COLORS.text,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 24}px) scale(${0.9 + 0.1 * titleIn})`,
              transformOrigin: "left bottom",
              lineHeight: "96px",
            }}
          >
            Overfitting
          </div>
          <div
            style={{
              position: "absolute",
              left: 4,
              bottom: -6,
              height: 6,
              width: 300 * underline,
              borderRadius: 3,
              background: COLORS.overfit,
            }}
          />
        </div>

        {/* "learns its training data so well … struggles with anything unfamiliar" */}
        <svg width={PLOT_W} height={PLOT_H} style={{ marginTop: 34, display: "block", opacity: plotIn, overflow: "hidden" }}>
          <line x1={0} y1={PLOT_H - 1} x2={PLOT_W} y2={PLOT_H - 1} stroke={COLORS.axis} strokeWidth={2} />
          <line x1={1} y1={0} x2={1} y2={PLOT_H} stroke={COLORS.axis} strokeWidth={2} />

          <line
            x1={sx(missPoint.x)}
            x2={sx(missPoint.x)}
            y1={pointY}
            y2={pointY + (curveY - pointY) * miss}
            stroke={COLORS.test}
            strokeWidth={3}
            strokeDasharray="7 6"
          />

          <path
            d={d}
            fill="none"
            stroke={COLORS.overfit}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 8px ${COLORS.overfit}99)` }}
          />

          {trainPoints.map((p, i) => {
            const s = spring({ frame: frame - (f(beats.learns) + 4 + i * 2), fps, config: { damping: 11 } });
            // Each dot flashes as the curve passes through it
            const hit = interpolate(draw, [p.x - 0.02, p.x, p.x + 0.06], [0, 1, 0], clamp);
            return (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={Math.max(0, 9 * s + 5 * hit)}
                fill={COLORS.train}
              />
            );
          })}

          {/* The unfamiliar point */}
          <circle
            cx={sx(missPoint.x)}
            cy={pointY - (1 - drop) * 120}
            r={Math.max(0, 11 * drop)}
            fill={COLORS.card}
            stroke={COLORS.test}
            strokeWidth={4}
            opacity={drop > 0 ? 1 : 0}
          />
          <g
            transform={`translate(${sx(missPoint.x)}, ${pointY + (curveY < pointY ? 46 : -46)}) scale(${Math.max(0, xMark)})`}
          >
            <circle r={20} fill={COLORS.overfit} />
            <path d="M-7,-7 L7,7 M7,-7 L-7,7" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          </g>
        </svg>

        <div style={{ marginTop: 28 }}>
          <Row frame={frame} start={f(beats.learns) + 30} icon="✓" color={COLORS.train}>
            Learns its training data <b>too</b> well
          </Row>
          <Row frame={frame} start={s0 + 24} icon="✕" color={COLORS.overfit}>
            Struggles with anything unfamiliar
          </Row>
        </div>
      </div>
    </AbsoluteFill>
  );
};
