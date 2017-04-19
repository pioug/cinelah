const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: [
    './index.js',
    './style.scss'
  ],
  output: {
    filename: 'bundle.js'
  },
  devServer: {
    host: '0.0.0.0',
    historyApiFallback: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: process.env.NODE_ENV === 'production' ?
          ExtractTextPlugin.extract({ use: ['css-loader', 'sass-loader'] }) :
          ['style-loader', 'css-loader', 'sass-loader']
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('styles.css')
  ]
};
