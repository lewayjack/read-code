const merge = require('webpack-merge');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const common = require('./webpack.common.js');

const prodCommon = {
  optimization: {
    usedExports: true,
    minimize: true
  },
  plugins: [
    new CompressionWebpackPlugin({
      filename: '[file].gz',
      algorithm: 'gzip',
      test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
      threshold: 10240,
      minRatio: 0.8
    })
  ],
};

module.exports = [
  merge(common, prodCommon, {
    output: {
      filename: 'earthsdk3-ue.js',
      library: {
        name: 'earthsdk3-ue',
        type: 'umd'
      },
    }
  }),
  merge(common, prodCommon, {
    output: {
      filename: 'earthsdk3-ue.esm.js',
      library: {
        type: 'module'
      },
    },
    experiments: {
      outputModule: true
    }
  })
];
