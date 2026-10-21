import React from "react";
import { Composition } from "remotion";
import { Overfitting, OVERFITTING_DURATION, OverfittingProps } from "./overfitting/Overfitting";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
