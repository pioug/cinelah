const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: [
    './index.js'
  ],
  output: {
    path: path.resolve(__dirname, '../public'),
    filename: 'bundle.js'
  },
  devServer: {
    disableHostCheck: true,
    historyApiFallback: true,
    host: '0.0.0.0',
    hot: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: process.env.NODE_ENV === 'production' ?
          ExtractTextPlugin.extract({ use: ['css-loader', 'sass-loader'] }) :
          ['style-loader', 'css-loader', 'sass-loader']
      }
    ],
  },
  plugins: (() => {
    return process.env.NODE_ENV === 'production' ? [
      new ExtractTextPlugin('style.css'),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.ejs',
        title: 'Cinelah',

        minify: {
          collapseWhitespace: true
        }
      })
    ] : [
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.ejs',
        title: 'Cinelah'
      })
    ];
  })()
};
