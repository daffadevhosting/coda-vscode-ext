//@ts-check

'use strict';

const path = require('path');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

const extensionConfig = {
  target: 'node',
	mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  devtool: 'nosources-source-map',
};

/** @type WebpackConfig */
const webviewConfig = {
    target: "web",
    mode: "development",
    entry: "./src/webview-ui/main.tsx",
    output: {
        path: path.resolve(__dirname, "out"),
        filename: "webview.js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            },
            // [BARU] Aturan untuk memproses CSS dengan Tailwind
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader'
                ]
            }
        ],
    },
    devtool: "inline-source-map",
};

module.exports = [ extensionConfig, webviewConfig ];