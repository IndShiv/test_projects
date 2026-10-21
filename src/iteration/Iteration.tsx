import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { models, mse, trainPoints } from "../overfitting/data";
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
 * Script:
 *   "When we train an AI model and it makes a mistake, we don't immediately throw it away.
 *    We look at what went wrong. We adjust. We try again.
 *    We call that iteration.
 *    And yet, when we make mistakes in our own lives, we sometimes treat them as evidence
 *    that we're not good enough."
 *
 * Each beat is the second in your voiceover where that phrase starts.
 */
export type IterationProps = {
  position: "left" | "center" | "right";
  showBackground: boolean;
  beats: {
    /** "When we train an AI model and it makes a mistake," */
    mistake: number;
    /** "we don't immediately throw it away." */
    notThrownAway: number;
    /** "We look at what went wrong." */
    look: number;
    /** "We adjust." */
    adjust: number;
    /** "We try again." */
    tryAgain: number;
    /** "We call that iteration." */
    iteration: number;
    /** "And yet, when we make mistakes in our own lives," */
    ourLives: number;
    /** "we sometimes treat them as evidence" */
    evidence: number;
    /** "that we're not good enough." */
    notGoodEnough: number;
    /** When the graphic should start leaving */
    out: number;
  };
};

export const iterationDefaults: IterationProps = {
  position: "right",
  showBackground: false,
  beats: {
    mistake: 0.2,
    notThrownAway: 3.4,
    look: 6.0,
    adjust: 8.2,
    tryAgain: 9.4,
    iteration: 11.4,
    ourLives: 14.0,
    evidence: 17.4,
    notGoodEnough: 19.4,
    out: 22.4,
  },
};

const EXIT_SECONDS = 0.6;

export const calculateIterationMetadata: CalculateMetadataFunction<IterationProps> = ({ props }) => ({
  durationInFrames: Math.ceil((props.beats.out + EXIT_SECONDS) * 30),
});

// A model that gets the pattern backwards, blended toward the good fit as it improves.
const wrongModel = (x: number) => -0.55 * models.goodFit(x);
const modelAt = (q: number) => (x: number) => wrongModel(x) + (models.goodFit(x) - wrongModel(x)) * q;
const maxError = mse(wrongModel, trainPoints);

// Quality after each attempt
const LEVELS = [0, 0.45, 0.8, 1];

const STEPS = ["Look", "Adjust", "Try again"];

const StepChips: React.FC<{ active: number | "all"; opacity: number }> = ({ active, opacity }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, height: 52, opacity }}>
    {STEPS.map((label, i) => {
      const on = active === "all" || active === i;
      const color = active === "all" ? COLORS.goodFit : COLORS.train;
      return (
        <React.Fragment key={label}>
          {i > 0 && <div style={{ color: COLORS.muted, fontSize: 24 }}>→</div>}
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 700,
              color: on ? color : COLORS.muted,
              background: on ? `${color}26` : "transparent",
              border: `2px solid ${on ? color : COLORS.cardBorder}`,
              transform: `scale(${on && active !== "all" ? 1.06 : 1})`,
            }}
          >
            {label}
          </div>
        </React.Fragment>
      );
    })}
    <div style={{ color: active === "all" ? COLORS.goodFit : COLORS.muted, fontSize: 34, marginLeft: 4 }}>↻</div>
  </div>
);

const Box: React.FC<{
  frame: number;
  start: number;
  color: string;
  width: number;
  children: React.ReactNode;
}> = ({ frame, start, color, width, children }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 13, stiffness: 150 } });
  return (
    <div
      style={{
        width,
        height: 104,
        borderRadius: 22,
        border: `3px solid ${color}`,
        background: `${color}1f`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontSize: 34,
        fontWeight: 700,
        opacity: Math.min(1, s),
        transform: `scale(${0.7 + 0.3 * s})`,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
};

const Arrow: React.FC<{ frame: number; start: number; color: string; dashed?: boolean }> = ({
  frame,
  start,
  color,
  dashed,
}) => {
  const p = progress(frame, start, 14);
  const len = 120;
  return (
    <svg width={len + 20} height={40} style={{ flexShrink: 0 }}>
      <line
        x1={10}
        y1={20}
        x2={10 + len * p}
        y2={20}
        stroke={color}
        strokeWidth={4}
        strokeDasharray={dashed ? "10 8" : undefined}
        strokeLinecap="round"
      />
      <path
        d={`M${len - 4},8 L${len + 10},20 L${len - 4},32`}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={p >= 1 ? 1 : 0}
      />
    </svg>
  );
};

const ComparisonRow: React.FC<{
  frame: number;
  label: string;
  mistakeAt: number;
  outcomeAt: number;
  good: boolean;
}> = ({ frame, label, mistakeAt, outcomeAt, good }) => {
  const labelIn = progress(frame, mistakeAt, 12);
  const outcomeColor = good ? COLORS.goodFit : COLORS.overfit;
  return (
    <div style={{ marginBottom: 46 }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
          color: COLORS.muted,
          marginBottom: 14,
          opacity: labelIn,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Box frame={frame} start={mistakeAt} color={COLORS.test} width={290}>
          <span style={{ fontSize: 30 }}>✕</span> Mistake
        </Box>
        <Arrow frame={frame} start={outcomeAt - 12} color={outcomeColor} dashed={!good} />
        <Box frame={frame} start={outcomeAt} color={outcomeColor} width={420}>
          {good ? (
            <>
              <span style={{ fontSize: 40 }}>↻</span> Iterate
            </>
          ) : (
            "Not good enough"
          )}
        </Box>
      </div>
    </div>
  );
};

export const Iteration: React.FC<IterationProps> = ({ position, showBackground, beats }) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const f = (seconds: number) => Math.round(seconds * fps);
  const B = Object.fromEntries(Object.entries(beats).map(([k, v]) => [k, f(v)])) as Record<
    keyof IterationProps["beats"],
    number
  >;
  const end = durationInFrames;

  // Card in / out
  const enter = spring({ frame: frame - B.mistake, fps, config: { damping: 16 } });
  const exit = interpolate(frame, [end - f(EXIT_SECONDS), end], [0, 1], { ...clamp, easing: ease });
  const scale = (0.92 + 0.08 * enter) * (1 - 0.06 * exit);
  const opacity = Math.min(enter, 1 - exit);
  const margin = 80;
  const left =
    position === "left" ? margin : position === "right" ? width - CARD_W - margin : (width - CARD_W) / 2;

  /* ----- The training loop ----- */
  // After the first "try again", two quicker look/adjust/try cycles finish the job.
  const loopStart = B.tryAgain + 24;
  const cycle = Math.max(24, (B.iteration + 36 - loopStart) / 2);
  const cycleStart = (k: number) => loopStart + k * cycle;
  const loopEnd = Math.round(cycleStart(2));

  const qFrames = [B.adjust, B.adjust + 24];
  const qValues = [LEVELS[0], LEVELS[1]];
  for (let k = 0; k < 2; k++) {
    qFrames.push(cycleStart(k) + cycle * 0.33, cycleStart(k) + cycle * 0.66);
    qValues.push(LEVELS[k + 1], LEVELS[k + 2]);
  }
  const q = interpolate(frame, qFrames, qValues, { ...clamp, easing: ease });
  const model = modelAt(q);
  const err = mse(model, trainPoints);

  let activeStep: number | "all" | null = null;
  if (frame >= loopEnd) activeStep = "all";
  else if (frame >= loopStart) activeStep = Math.min(2, Math.floor((((frame - loopStart) % cycle) / cycle) * 3));
  else if (frame >= B.tryAgain) activeStep = 2;
  else if (frame >= B.adjust) activeStep = 1;
  else if (frame >= B.look) activeStep = 0;

  const attemptStarts = [B.look, B.tryAgain, cycleStart(0), cycleStart(1)].map(Math.round);

  const draw = progress(frame, B.mistake + 30, 40);
  const curve: [number, number][] = [];
  for (let i = 0; i <= 400 * draw; i++) curve.push([sx(i / 400), sy(model(i / 400))]);
  const curveColor = interpolateColors(q, [0, 0.5, 1], [COLORS.overfit, COLORS.underfit, COLORS.goodFit]);

  const errLines = progress(frame, B.look, 24);
  const bin = spring({ frame: frame - B.notThrownAway, fps, config: { damping: 12 } });
  const binSlash = progress(frame, B.notThrownAway + 14, 14);
  const binOut = interpolate(frame, [B.look - 8, B.look + 4], [1, 0], clamp);

  const scene1Out = interpolate(frame, [B.ourLives, B.ourLives + 16], [1, 0], clamp);
  const lowerIn = progress(frame, B.look, 16);

  // Card shrinks to fit the comparison scene
  const cardH = interpolate(frame, [B.ourLives + 4, B.ourLives + 24], [CARD_H, 660], { ...clamp, easing: ease });

  /* ----- Header ----- */
  const titleSwap = progress(frame, B.iteration, 16);

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
          height: cardH,
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
          <div style={{ position: "relative", height: 78 }}>
            {[
              { text: "Training a model", o: 1 - titleSwap },
              { text: "Iteration", o: titleSwap },
            ].map((t) => (
              <div
                key={t.text}
                style={{
                  position: "absolute",
                  fontSize: 64,
                  fontWeight: 800,
                  color: COLORS.text,
                  letterSpacing: -1,
                  opacity: t.o,
                  transform: `translateY(${(1 - t.o) * (t.text === "Iteration" ? 18 : -18)}px)`,
                }}
              >
                {t.text}
              </div>
            ))}
          </div>
          <Pill frame={frame} from={B.mistake + 56} to={B.look} color={COLORS.overfit} label="Mistake" />
          {attemptStarts.map((start, i) => (
            <Pill
              key={i}
              frame={frame}
              from={start}
              to={Math.max(start + 16, attemptStarts[i + 1] ?? loopEnd)}
              color={COLORS.train}
              label={`Attempt ${i + 1}`}
            />
          ))}
          <Pill frame={frame} from={loopEnd} to={Math.max(loopEnd + 16, B.ourLives)} color={COLORS.goodFit} label="Improved" />
          <div style={{ position: "absolute", top: 90, left: 0, width: "100%" }}>
            <Caption frame={frame} from={B.mistake + 40} to={B.notThrownAway}>
              The model makes a mistake…
            </Caption>
            <Caption frame={frame} from={B.notThrownAway} to={B.look}>
              …but we don't throw it away
            </Caption>
            <Caption frame={frame} from={B.look} to={B.adjust}>
              We look at what went wrong
            </Caption>
            <Caption frame={frame} from={B.adjust} to={B.tryAgain}>
              We adjust
            </Caption>
            <Caption frame={frame} from={B.tryAgain} to={B.iteration}>
              We try again
            </Caption>
            <Caption frame={frame} from={B.iteration} to={B.ourLives}>
              Look, adjust, try again: that's iteration
            </Caption>
            <Caption frame={frame} from={B.ourLives} to={B.evidence}>
              And yet, in our own lives…
            </Caption>
            <Caption frame={frame} from={B.evidence} to={end + 10}>
              …a mistake can feel like evidence against us
            </Caption>
          </div>
        </div>

        {/* Scene 1: the training loop */}
        {frame < B.ourLives + 16 && (
          <>
            <svg
              width={PLOT_W}
              height={PLOT_H + 60}
              style={{ position: "absolute", left: PAD, top: PLOT_TOP, overflow: "visible", opacity: scene1Out }}
              fontFamily={FONT}
            >
              <Axes frame={frame} start={B.mistake + 6} xLabel="input" yLabel="output" />
              <defs>
                <clipPath id="iter-plot-clip">
                  <rect x={0} y={0} width={PLOT_W} height={PLOT_H} />
                </clipPath>
              </defs>

              {trainPoints.map((p, i) => {
                const yCurve = sy(model(p.x));
                const yPoint = sy(p.y);
                return (
                  <line
                    key={i}
                    x1={sx(p.x)}
                    x2={sx(p.x)}
                    y1={yPoint}
                    y2={yPoint + (yCurve - yPoint) * errLines}
                    stroke={COLORS.test}
                    strokeWidth={3}
                    strokeDasharray="8 7"
                    opacity={0.85}
                    clipPath="url(#iter-plot-clip)"
                  />
                );
              })}

              <g clipPath="url(#iter-plot-clip)">
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
                <Dot key={i} p={p} frame={frame} start={B.mistake + 14 + i * 3} color={COLORS.train} />
              ))}

              {/* "we don't immediately throw it away" */}
              <g
                transform={`translate(${PLOT_W - 90}, 80) scale(${Math.max(0, bin)})`}
                opacity={binOut}
              >
                <circle r={62} fill="rgba(12,16,28,0.95)" stroke={COLORS.cardBorder} strokeWidth={2} />
                <g stroke={COLORS.text} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M-24,-14 L-19,30 L19,30 L24,-14" />
                  <path d="M-30,-14 L30,-14" />
                  <path d="M-9,-14 L-9,-22 L9,-22 L9,-14" />
                  <path d="M-8,-4 L-6,20 M8,-4 L6,20" />
                </g>
                <circle
                  r={48}
                  fill="none"
                  stroke={COLORS.overfit}
                  strokeWidth={7}
                  strokeDasharray={`${2 * Math.PI * 48 * binSlash} 999`}
                  transform="rotate(-135)"
                />
                <line
                  x1={-34}
                  y1={-34}
                  x2={-34 + 68 * binSlash}
                  y2={-34 + 68 * binSlash}
                  stroke={COLORS.overfit}
                  strokeWidth={7}
                  strokeLinecap="round"
                />
              </g>
            </svg>

            <div
              style={{
                position: "absolute",
                left: PAD,
                top: PLOT_TOP + PLOT_H + 62,
                width: PLOT_W,
                opacity: lowerIn * scene1Out,
              }}
            >
              <StepChips active={activeStep ?? -1} opacity={1} />
              <div style={{ display: "flex", alignItems: "center", height: 52, marginTop: 6 }}>
                <div style={{ width: 110, fontSize: 24, color: COLORS.muted }}>Error</div>
                <div
                  style={{
                    height: 22,
                    width: Math.max(6, ((PLOT_W - 220) * err) / maxError),
                    background: curveColor,
                    borderRadius: 11,
                  }}
                />
                <div style={{ marginLeft: 16, fontSize: 24, fontWeight: 700, color: curveColor }}>
                  {err.toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Scene 2: models vs. us */}
        {frame >= B.ourLives && (
          <div style={{ position: "absolute", left: PAD, top: PLOT_TOP + 40, width: PLOT_W }}>
            <ComparisonRow
              frame={frame}
              label="AN AI MODEL"
              mistakeAt={B.ourLives + 8}
              outcomeAt={B.ourLives + 20}
              good
            />
            <ComparisonRow
              frame={frame}
              label="US"
              mistakeAt={B.ourLives + 40}
              outcomeAt={B.notGoodEnough}
              good={false}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
