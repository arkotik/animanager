const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const project = require('./project.config');
const dist = path.join(__dirname, project.out);
const inProject = (p) => path.join(__dirname, project.src, p);

module.exports = {
  entry: {
    animanager: ['babel-polyfill', inProject('animanager.js')],
    animator: [inProject('animator.js')]
  },
  output: {
    path: dist,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { sourceMap: true }
        }
      }
    ]
  },
  resolve: {
    alias: {},
    extensions: ['*', '.js']
  },
  plugins: [
    new CleanWebpackPlugin([project.out])
  ]
};
