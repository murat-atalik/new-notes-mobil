module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // zod v4 ships `export * as core from ...`, which the RN preset does not transform.
  // react-native-worklets/plugin (Reanimated 4) must stay last.
  plugins: ['@babel/plugin-transform-export-namespace-from', 'react-native-worklets/plugin'],
};
