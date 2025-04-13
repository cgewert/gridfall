const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [
    ],
  },
  devServer: {
    watchFiles: "./src/..", // remove this line to disable Browser refresh
    static: {
      directory: path.join(__dirname, 'assets'),
    },
    compress: true,
    port: 9000,
  },
  target: 'web',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {from: '*.css', context: 'src/'},
        {from: 'src/index.html'},
        {from: 'assets/gfx', to: 'assets/gfx/'},
        {from: 'assets/audio', to: 'assets/audio/'},
      ],
    }),
  ],
};
