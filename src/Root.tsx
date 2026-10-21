import React from "react";
import { Composition } from "remotion";
import { Overfitting, OVERFITTING_DURATION, OverfittingProps } from "./overfitting/Overfitting";
import { calculateIterationMetadata, Iteration, iterationDefaults } from "./iteration/Iteration";
import {
  calculateFocusMetadata,
  OverfittingFocus,
  overfittingFocusDefaults,
} from "./overfitting-focus/OverfittingFocus";
import {
  calculateIntroMetadata,
  OverfittingIntro,
  overfittingIntroDefaults,
} from "./overfitting-intro/OverfittingIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* "When we train an AI model and it makes a mistake..." */}
      <Composition
        id="Iteration"
        component={Iteration}
        calculateMetadata={calculateIterationMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={iterationDefaults}
      />
      <Composition
        id="IterationPreview"
        component={Iteration}
        calculateMetadata={calculateIterationMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ ...iterationDefaults, showBackground: true }}
      />
      {/* The original explainer's overfitting section, timed to the spoken line */}
      <Composition
        id="OverfittingFocus"
        component={OverfittingFocus}
        calculateMetadata={calculateFocusMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={overfittingFocusDefaults}
      />
      <Composition
        id="OverfittingFocusPreview"
        component={OverfittingFocus}
        calculateMetadata={calculateFocusMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ ...overfittingFocusDefaults, showBackground: true }}
      />
      {/* Short overlay timed to: "Here's another interesting concept, overfitting. ..." */}
      <Composition
        id="OverfittingIntro"
        component={OverfittingIntro}
        calculateMetadata={calculateIntroMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={overfittingIntroDefaults}
      />
      <Composition
        id="OverfittingIntroPreview"
        component={OverfittingIntro}
        calculateMetadata={calculateIntroMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ ...overfittingIntroDefaults, showBackground: true }}
      />
      {/* Transparent overlay: render to ProRes 4444 or WebM to keep the alpha channel */}
      <Composition
        id="Overfitting"
        component={Overfitting}
        durationInFrames={OVERFITTING_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ position: "right", showBackground: false } satisfies OverfittingProps}
      />
      {/* Same animation on a dark background, for quick previews as MP4 */}
      <Composition
        id="OverfittingPreview"
        component={Overfitting}
        durationInFrames={OVERFITTING_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ position: "right", showBackground: true } satisfies OverfittingProps}
      />
    </>
  );
};
