const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = (env, { mode }) => ({
  devServer: {
    contentBase: false,
    stats: 'minimal',
  },
  devtool: mode === 'production' ? '' : 'source-map',
  module: {
    rules: [
      {
        test: /\.ts/,
        include: path.resolve(__dirname, 'src'),
        use: 'ts-loader',
      },
    ],
  },
  output: {
    filename: mode === 'production' ? '[chunkhash].js' : '[name].js',
    chunkFilename: mode === 'production' ? '[chunkhash].js' : '[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  stats: 'verbose',
})
