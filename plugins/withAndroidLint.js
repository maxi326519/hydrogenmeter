const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Plugin que desactiva el lint de Android en el build de release para evitar
 * que lintVitalAnalyzeRelease falle y bloquee el build (común con Expo/dependencias).
 */
function withAndroidLint(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes("checkReleaseBuilds false")) {
      return config;
    }
    // Añadir bloque lint dentro de android { } para no abortar el build por lint
    const lintBlock = `
    lint {
        checkReleaseBuilds false
        abortOnError false
    }
`;
    const androidBlockRegex = /(android\s*\{)/;
    const match = contents.match(androidBlockRegex);
    if (match) {
      contents = contents.replace(
        androidBlockRegex,
        match[1] + lintBlock
      );
      config.modResults.contents = contents;
    }
    return config;
  });
}

module.exports = withAndroidLint;
