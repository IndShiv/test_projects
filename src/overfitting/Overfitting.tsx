import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  models,
  mse,
  Point,
  sweetSpot,
  testErrorCurve,
  testPoints,
  trainErrorCurve,
  trainPoints,
} from "./data";
import { COLORS, FONT } from "../theme";

export type OverfittingProps = {
  /** Where the card sits on screen, so it doesn't cover the speaker. */
  position: "left" | "center" | "right";
  /** Draw a solid backdrop behind the overlay (useful for previewing). */
  showBackground: boolean;
};

// Card + plot geometry
const CARD_W = 1040;
const CARD_H = 900;
const PAD = 52;
const PLOT_W = CARD_W - PAD * 2;
const PLOT_H = 480;
const PLOT_TOP = 200;

// Timeline (frames at 30 fps)
const T = {
  cardIn: 0,
  axes: 15,
  points: 40,
  lineDraw: 90,
  toGoodFit: 210,
  toOverfit: 330,
  testIn: 450,
  errorLines: 485,
  bars: 510,
  scene1Out: 630,
  scene2: 640,
  cardOut: 900,
  end: 930,
};
export const OVERFITTING_DURATION = T.end;

const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const progress = (frame: number, start: number, length: number) =>
  interpolate(frame, [start, start + length], [0, 1], { ...clamp, easing: ease });

// Data-space -> plot-space
const Y_RANGE = 1.6;
const sx = (x: number) => x * PLOT_W;
const sy = (y: number) => PLOT_H / 2 - (y / Y_RANGE) * (PLOT_H / 2);

const pathFrom = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

const Caption: React.FC<{ frame: number; from: number; to: number; children: React.ReactNode }> = ({
  frame,
  from,
  to,
  children,
}) => {
  const opacity = interpolate(frame, [from, from + 10, to - 10, to], [0, 1, 1, 0], clamp);
  const y = interpolate(frame, [from, from + 12], [12, 0], { ...clamp, easing: ease });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity,
        transform: `translateY(${y}px)`,
        fontSize: 34,
        color: COLORS.muted,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

const Pill: React.FC<{ frame: number; from: number; to: number; color: string; label: string }> = ({
  frame,
  from,
  to,
  color,
  label,
}) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - from, fps, config: { damping: 14 } });
  const opacity = interpolate(frame, [from, from + 6, to - 8, to], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 6,
        opacity,
        transform: `scale(${0.8 + 0.2 * pop})`,
        transformOrigin: "right center",
        padding: "10px 22px",
        borderRadius: 999,
        background: `${color}22`,
        border: `2px solid ${color}`,
        color,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

const Axes: React.FC<{ frame: number; start: number; xLabel?: string; yLabel?: string }> = ({
  frame,
  start,
  xLabel,
  yLabel,
}) => {
  const p = progress(frame, start, 30);
  const labelOpacity = progress(frame, start + 15, 20);
  return (
    <g>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          x2={PLOT_W * p}
          y1={PLOT_H * f}
          y2={PLOT_H * f}
          stroke={COLORS.grid}
          strokeWidth={2}
        />
      ))}
      <line x1={0} y1={PLOT_H} x2={PLOT_W * p} y2={PLOT_H} stroke={COLORS.axis} strokeWidth={3} />
      <line x1={0} y1={PLOT_H} x2={0} y2={PLOT_H * (1 - p)} stroke={COLORS.axis} strokeWidth={3} />
      {xLabel && (
        <text
          x={PLOT_W}
          y={PLOT_H + 44}
          textAnchor="end"
          fill={COLORS.muted}
          fontSize={24}
          opacity={labelOpacity}
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={-16}
          y={-14}
          transform="rotate(-90)"
          textAnchor="end"
          fill={COLORS.muted}
          fontSize={24}
          opacity={labelOpacity}
        >
          {yLabel}
        </text>
      )}
    </g>
  );
};

const Dot: React.FC<{ p: Point; frame: number; start: number; hollow?: boolean; color: string }> = ({
  p,
  frame,
  start,
  hollow,
  color,
}) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 160 } });
  if (s <= 0) return null;
  return (
    <circle
      cx={sx(p.x)}
      cy={sy(p.y)}
      r={11 * s}
      fill={hollow ? "rgba(12,16,28,0.9)" : color}
      stroke={color}
      strokeWidth={hollow ? 4 : 0}
    />
  );
};

/* ---------- Scene 1: fitting a curve to data ---------- */

const FitScene: React.FC<{ frame: number }> = ({ frame }) => {
  const draw = progress(frame, T.lineDraw, 40);
  const toGood = progress(frame, T.toGoodFit, 40);
  const toOver = progress(frame, T.toOverfit, 50);
  const fadeOut = interpolate(frame, [T.scene1Out, T.scene1Out + 20], [1, 0], clamp);

  const modelAt = (x: number) => {
    const a = models.underfit(x) + (models.goodFit(x) - models.underfit(x)) * toGood;
    return a + (models.overfit(x) - a) * toOver;
  };

  const curveColor = interpolateColors(
    frame,
    [T.toGoodFit, T.toGoodFit + 40, T.toOverfit, T.toOverfit + 50],
    [COLORS.underfit, COLORS.goodFit, COLORS.goodFit, COLORS.overfit],
  );

  const samples = 400;
  const curve: [number, number][] = [];
  for (let i = 0; i <= samples * draw; i++) {
    const x = i / samples;
    curve.push([sx(x), sy(modelAt(x))]);
  }

  const errGrow = progress(frame, T.errorLines, 40);
  const legendOpacity = progress(frame, T.testIn, 20);

  return (
    <g opacity={fadeOut}>
      <Axes frame={frame} start={T.axes} xLabel="input" yLabel="output" />
      <defs>
        <clipPath id="plot-clip">
          <rect x={0} y={0} width={PLOT_W} height={PLOT_H} />
        </clipPath>
      </defs>

      {/* Error lines from new data to the overfit curve */}
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
            opacity={0.85 * fadeOut}
            clipPath="url(#plot-clip)"
          />
        );
      })}

      <g clipPath="url(#plot-clip)">
        <path
          d={pathFrom(curve)}
          fill="none"
          stroke={curveColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 10px ${curveColor}88)` }}
        />
      </g>

      {trainPoints.map((p, i) => (
        <Dot key={i} p={p} frame={frame} start={T.points + i * 4} color={COLORS.train} />
      ))}
      {testPoints.map((p, i) => (
        <Dot key={i} p={p} frame={frame} start={T.testIn + i * 4} color={COLORS.test} hollow />
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
    </g>
  );
};

const ErrorBars: React.FC<{ frame: number }> = ({ frame }) => {
  const trainErr = mse(models.overfit, trainPoints);
  const testErr = mse(models.overfit, testPoints);
  const appear = progress(frame, T.bars, 20);
  const grow = progress(frame, T.bars + 10, 40);
  const fadeOut = interpolate(frame, [T.scene1Out, T.scene1Out + 20], [1, 0], clamp);
  const maxW = PLOT_W - 300;
  const rows = [
    { label: "Training error", value: trainErr, color: COLORS.train },
    { label: "Test error", value: testErr, color: COLORS.test },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: PAD,
        top: PLOT_TOP + PLOT_H + 62,
        width: PLOT_W,
        opacity: appear * fadeOut,
      }}
    >
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", height: 52 }}>
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
      ))}
    </div>
  );
};

/* ---------- Scene 2: error vs. model complexity ---------- */

const ComplexityScene: React.FC = () => {
  const frame = useCurrentFrame(); // local to the Sequence
  const fadeIn = progress(frame, 0, 20);
  const trainDraw = progress(frame, 30, 70);
  const testDraw = progress(frame, 50, 80);
  const spot = progress(frame, 140, 25);
  const regions = progress(frame, 165, 30);

  const ERR_MAX = 1.0;
  const cx = (c: number) => c * PLOT_W;
  const cy = (e: number) => PLOT_H - (e / ERR_MAX) * PLOT_H * 0.92;
  const build = (fn: (c: number) => number, upTo: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 300 * upTo; i++) pts.push([cx(i / 300), cy(fn(i / 300))]);
    return pathFrom(pts);
  };

  const spotX = cx(sweetSpot);
  const spotY = cy(testErrorCurve(sweetSpot));

  return (
    <g opacity={fadeIn}>
      <rect x={0} y={0} width={spotX} height={PLOT_H} fill={COLORS.underfit} opacity={0.05 * regions} />
      <rect
        x={spotX}
        y={0}
        width={PLOT_W - spotX}
        height={PLOT_H}
        fill={COLORS.overfit}
        opacity={0.08 * regions}
      />
      <text
        x={spotX / 2}
        y={44}
        textAnchor="middle"
        fill={COLORS.underfit}
        fontSize={26}
        fontWeight={700}
        opacity={regions}
      >
        UNDERFITTING
      </text>
      <text
        x={spotX + (PLOT_W - spotX) / 2}
        y={44}
        textAnchor="middle"
        fill={COLORS.overfit}
        fontSize={26}
        fontWeight={700}
        opacity={regions}
      >
        OVERFITTING
      </text>

      <Axes frame={frame} start={10} xLabel="model complexity →" yLabel="error" />

      <path d={build(trainErrorCurve, trainDraw)} fill="none" stroke={COLORS.train} strokeWidth={6} strokeLinecap="round" />
      <path d={build(testErrorCurve, testDraw)} fill="none" stroke={COLORS.test} strokeWidth={6} strokeLinecap="round" />

      <g opacity={progress(frame, 100, 20)}>
        <text x={cx(0.97)} y={cy(trainErrorCurve(0.97)) - 18} textAnchor="end" fill={COLORS.train} fontSize={24} fontWeight={600}>
          Training error
        </text>
        <text x={cx(0.97)} y={cy(testErrorCurve(0.97)) - 26} textAnchor="end" fill={COLORS.test} fontSize={24} fontWeight={600}>
          Test error
        </text>
      </g>

      <g opacity={spot}>
        <line
          x1={spotX}
          x2={spotX}
          y1={PLOT_H}
          y2={PLOT_H - (PLOT_H - spotY + 70) * spot}
          stroke={COLORS.goodFit}
          strokeWidth={3}
          strokeDasharray="8 7"
        />
        <circle cx={spotX} cy={spotY} r={14 * spot} fill={COLORS.goodFit} style={{ filter: `drop-shadow(0 0 12px ${COLORS.goodFit})` }} />
        <text x={spotX} y={spotY - 84} textAnchor="middle" fill={COLORS.goodFit} fontSize={28} fontWeight={700}>
          Sweet spot
        </text>
      </g>
    </g>
  );
};

/* ---------- Composition ---------- */

export const Overfitting: React.FC<OverfittingProps> = ({ position, showBackground }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const enter = spring({ frame: frame - T.cardIn, fps, config: { damping: 16 } });
  const exit = interpolate(frame, [T.cardOut, T.end], [0, 1], { ...clamp, easing: ease });
  const scale = (0.92 + 0.08 * enter) * (1 - 0.06 * exit);
  const opacity = Math.min(enter, 1 - exit);

  const margin = 80;
  const left =
    position === "left" ? margin : position === "right" ? width - CARD_W - margin : (width - CARD_W) / 2;

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
          <div style={{ fontSize: 64, fontWeight: 800, color: COLORS.text, letterSpacing: -1 }}>
            Overfitting
          </div>
          <Pill frame={frame} from={T.lineDraw} to={T.toGoodFit} color={COLORS.underfit} label="Underfit" />
          <Pill frame={frame} from={T.toGoodFit} to={T.toOverfit} color={COLORS.goodFit} label="Good fit" />
          <Pill frame={frame} from={T.toOverfit} to={T.scene1Out} color={COLORS.overfit} label="Overfit" />
          <div style={{ position: "absolute", top: 90, left: 0, width: "100%" }}>
            <Caption frame={frame} from={T.points} to={T.lineDraw}>
              A model learns from training data
            </Caption>
            <Caption frame={frame} from={T.lineDraw} to={T.toGoodFit}>
              Too simple: it misses the pattern
            </Caption>
            <Caption frame={frame} from={T.toGoodFit} to={T.toOverfit}>
              Just right: it captures the real trend
            </Caption>
            <Caption frame={frame} from={T.toOverfit} to={T.testIn}>
              Too complex: it memorises the noise
            </Caption>
            <Caption frame={frame} from={T.testIn} to={T.scene1Out}>
              …so it fails on new, unseen data
            </Caption>
            <Caption frame={frame} from={T.scene2} to={T.scene2 + 140}>
              More complexity isn't always better
            </Caption>
            <Caption frame={frame} from={T.scene2 + 140} to={T.end}>
              Aim for the sweet spot in between
            </Caption>
          </div>
        </div>

        <svg
          width={PLOT_W}
          height={PLOT_H + 60}
          style={{ position: "absolute", left: PAD, top: PLOT_TOP, overflow: "visible" }}
          fontFamily={FONT}
        >
          {frame < T.scene1Out + 20 && <FitScene frame={frame} />}
          <Sequence from={T.scene2} layout="none">
            <ComplexityScene />
          </Sequence>
        </svg>

        <ErrorBars frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
