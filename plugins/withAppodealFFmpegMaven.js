const {
  createRunOncePlugin,
  withProjectBuildGradle,
} = require("@expo/config-plugins");

/**
 * FFmpeg Kit retiró binarios de Maven Central; este mirror permite resolver
 * com.arthenica:ffmpeg-kit-* (p. ej. full-gpl) en builds Android.
 */
function withAppodealFFmpegMaven(config) {
  return withProjectBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    const marker = "artifactory.appodeal.com";
    if (contents.includes(marker)) {
      return cfg;
    }
    const jitpack = "maven { url 'https://www.jitpack.io' }";
    const addition =
      "maven { url 'https://artifactory.appodeal.com/appodeal-public' }";
    if (!contents.includes(jitpack)) {
      throw new Error(
        "withAppodealFFmpegMaven: bloque jitpack no encontrado en android/build.gradle",
      );
    }
    cfg.modResults.contents = contents.replace(
      jitpack,
      `${jitpack}\n        ${addition}`,
    );
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withAppodealFFmpegMaven,
  "with-appodeal-ffmpeg-maven",
);
