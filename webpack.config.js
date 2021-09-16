const path = require('path')

const minify = process.env?.MINIFY === 'yes'
console.log("minify:", minify)

module.exports = {
    entry: './lib/exports.ts',
    mode: minify ? 'production' : 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: minify ? 'peerjs.min.js' : 'peerjs.js',
        path: path.resolve(__dirname, 'dist'),
    },
}