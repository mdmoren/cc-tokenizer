const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './dist/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'ccTokenizer.umd.js',
    library: {
      name: 'CCTokenizer',
      type: 'umd',
    },
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser")
    },
    alias: {
      'process/browser': require.resolve('process/browser')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  // Remove axios from externals to bundle it for browser use
  externals: {
    // 'axios': 'axios' // Removed - axios will be bundled
  }
};