const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    bundle: './index.js',
    sw: './sw.js'
  },
  output: {
    path: path.resolve(__dirname, '../public'),
    publicPath: '/',
    filename: '[name].js'
  },
  devServer: {
    disableHostCheck: true,
    historyApiFallback: true,
    host: '0.0.0.0',
    hot: true
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
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
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader']
          }) :
          ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: process.env.NODE_ENV === 'production' ? [
          {
            loader: 'file-loader',
            query: {
              name: '[name].[ext]',
            }
          }, {
            loader: 'image-webpack-loader',
            query: {
              optipng: {
                optimizationLevel: 7
              },
              pngquant: {
                quality: '80-90'
              }
            }
          }
        ] : ['file-loader']
      },
      {
        test: /\.json$/,
        use: [{
          loader: 'file-loader',
          query: {
            name: '[name].[ext]'
          }
        }]
      },
    ],
  },
  plugins: (() => {
    return process.env.NODE_ENV === 'production' ? [
      new webpack.DefinePlugin({
        PRODUCTION: 'true'
      }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new UglifyJSPlugin({
        sourceMap: true
      }),
      new CopyWebpackPlugin([{
        from: 'manifest.json',
        transform: content => JSON.stringify(JSON.parse(content))
      }]),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.ejs',
        title: 'Cinelah',
        env: process.env.NODE_ENV,
        minify: {
          collapseWhitespace: true,
          minifyJS: true
        },
        excludeChunks: ['sw']
      }),
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'async'
      }),
      new ExtractTextPlugin('style.css'),
      new StyleExtHtmlWebpackPlugin()
    ] : [
      new webpack.DefinePlugin({
        PRODUCTION: 'false'
      }),
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.ejs',
        title: 'Cinelah',
        excludeChunks: ['sw'],
        env: process.env.NODE_ENV
      }),
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'async'
      })
    ];
  })()
};
