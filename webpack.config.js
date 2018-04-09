const path = require('path');

module.exports = {
  entry: {
    main: './index.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: ['babel-loader', 'eslint-loader'],
        include: [
          path.resolve(__dirname, 'src')
        ]
      }
    ]
  },
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'dist',
    libraryTarget: 'umd'
  }
};
