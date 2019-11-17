const path = require("path");
const webpack = require("webpack");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const StyleExtHtmlWebpackPlugin = require("style-ext-html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: {
    bundle: "./index.js"
  },
  output: {
    path: path.resolve(__dirname, "../public"),
    publicPath: "/",
    filename: "[name].js"
  },
  devServer: {
    disableHostCheck: true,
    historyApiFallback: true,
    host: "0.0.0.0",
    hot: true
  },
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: process.env.NODE_ENV === "production" ? false : "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["babel-loader"],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use:
          process.env.NODE_ENV === "production"
            ? [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "postcss-loader",
                "sass-loader"
              ]
            : ["style-loader", "css-loader", "postcss-loader", "sass-loader"]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use:
          process.env.NODE_ENV === "production"
            ? [
                {
                  loader: "file-loader",
                  query: {
                    name: "[name].[ext]"
                  }
                },
                {
                  loader: "image-webpack-loader",
                  query: {
                    optipng: {
                      optimizationLevel: 7
                    },
                    pngquant: {
                      quality: [0.8, 0.9]
                    }
                  }
                }
              ]
            : ["file-loader"]
      },
      {
        test: /\.json$/,
        use: [
          {
            loader: "file-loader",
            query: {
              name: "[name].[ext]"
            }
          }
        ]
      }
    ]
  },
  plugins: (() => {
    return process.env.NODE_ENV === "production"
      ? [
          new webpack.DefinePlugin({
            PRODUCTION: "true"
          }),
          new webpack.optimize.ModuleConcatenationPlugin(),
          new TerserPlugin({
            sourceMap: true
          }),
          new CopyWebpackPlugin([
            {
              from: "manifest.json",
              transform: content => JSON.stringify(JSON.parse(content))
            },
            {
              from: "robots.txt"
            }
          ]),
          new HtmlWebpackPlugin({
            filename: "index.html",
            template: "index.ejs",
            title: "Cinelah",
            env: process.env.NODE_ENV,
            minify: {
              collapseWhitespace: true,
              minifyJS: true
            }
          }),
          new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: "async"
          }),
          new MiniCssExtractPlugin({
            filename: "style.css"
          }),
          new StyleExtHtmlWebpackPlugin()
        ]
      : [
          new webpack.DefinePlugin({
            PRODUCTION: "false"
          }),
          new webpack.HotModuleReplacementPlugin(),
          new HtmlWebpackPlugin({
            filename: "index.html",
            template: "index.ejs",
            title: "Cinelah",
            env: process.env.NODE_ENV
          }),
          new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: "async"
          })
        ];
  })()
};
