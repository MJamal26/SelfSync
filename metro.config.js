const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration — extended to fix react-native-svg TS resolution.
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Ensure TypeScript source files inside node_modules are resolved.
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      'ts',
      'tsx',
      'svg',
    ],
    // Disable package.json "exports" field resolution — some libraries
    // (e.g. react-native-svg 15.x) use internal paths that the exports
    // field doesn't expose, causing Metro to report "file not found".
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(defaultConfig, config);
