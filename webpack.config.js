//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
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
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log",
  },
};

const webviewConfig = {
    target: "web",
    mode: "development",
    entry: "./src/webview-ui/main.tsx",
    output: {
        path: path.resolve(__dirname, "out"),
        filename: "webview.js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    // BARIS BARU DI BAWAH INI
                    options: {
                        configFile: path.resolve(__dirname, 'src', 'webview-ui', 'tsconfig.json')
                    }
                }],
            },
        ],
    },
    devtool: "inline-source-map",
};

module.exports = [ extensionConfig, webviewConfig ];