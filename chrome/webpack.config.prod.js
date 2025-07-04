const { CheckerPlugin } = require('awesome-typescript-loader');
const { join } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    content_worker_data_center: join(__dirname, 'src/content_worker_data_center.js'),
    amazon_data_center: join(__dirname, 'src/amazon_data_center.js'),
    floatingStyle: join(__dirname, 'src/floating.css'), // Added entry point for floating.css
    contentPage: join(__dirname, 'src/contentPage.ts'),
    authPage: join(__dirname, 'src/authPage.ts'),
    serviceWorker: join(__dirname, 'src/serviceWorker.ts')
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      },
    ],
  },
  output: {
    path: join(__dirname, '../angular/dist'),
    filename: '[name].js'
  },
  plugins: [
    new CheckerPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.css']
  }
};
