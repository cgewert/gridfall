const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  console.log(`Building "Gridfall" for ${isProd ? 'production' : 'development'} mode...`);
  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
    },
     resolve: {
      extensions: ['.ts', '.js'],
    },
  module: {
    rules: [
      // transpile typescript files
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: isProd ? 'tsconfig.prod.json' : 'tsconfig.dev.json',
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
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
        {from: 'assets/mov', to: 'assets/mov/'},
      ],
    }),
  ],
};
};
