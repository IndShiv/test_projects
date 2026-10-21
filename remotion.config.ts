import { Config } from "@remotion/cli/config";

// Keep alpha channel support: PNG frames are needed for transparent renders.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
