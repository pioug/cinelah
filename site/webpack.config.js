const path = require('path');
module.exports = {
  entry: [
    './index.js',
    './style.css'
  ],
  output: {
    filename: 'bundle.js'
  },
  devServer: {
    host: '0.0.0.0',
    historyApiFallback: true,
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
    ],
  }
}
