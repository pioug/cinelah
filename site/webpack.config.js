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
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
    ],
  }
};
