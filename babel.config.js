module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // zod v4 ships `export * as core from ...`, which the RN preset does not transform.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
