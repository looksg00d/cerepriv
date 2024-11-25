const { resolve } = require("path");
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/index.ts',
    mode: 'production',
    output: {
        filename: 'bundle.js',
        path: resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "stream": false,
            "crypto": false,
            "fs": false,
            "path": false,
            "net": false,
            "tls": false
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },
    target: "node",
    externals: [
        nodeExternals({
            allowlist: ['@cere-ddc-sdk/ddc-client', '@cere-ddc-sdk/blockchain']
        })
    ],
    plugins: [
        new webpack.IgnorePlugin({
            resourceRegExp: /^electron$/
        })
    ],
    optimization: {
        minimize: false // Отключаем минификацию для лучшей отладки
    }
};