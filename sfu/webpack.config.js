const path = require('path');

module.exports = {
  mode: 'production',
  entry: './mediasoup-client-entry.js',
  output: {
    path: path.resolve(__dirname, 'src/sfu'),
    filename: 'mediasoup-client.js',
    library: 'mediasoupClient',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.js'],
  },
};
