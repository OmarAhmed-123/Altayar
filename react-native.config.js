/**
 * React Native Configuration
 * This file configures React Native modules, especially for fonts and assets
 * Updated for React Native 0.82+ with proper autolinking
 */

module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: [
    './src/assets/fonts/',
    './node_modules/react-native-vector-icons/Fonts/',
  ],
  // React Native 0.82+ uses autolinking, so we don't need manual dependency configuration
  // The autolinking will handle react-native-vector-icons automatically
};

