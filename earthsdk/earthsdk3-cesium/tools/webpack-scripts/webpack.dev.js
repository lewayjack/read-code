const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const devCommon = {
  devtool: 'inline-source-map',
  optimization: {
    usedExports: true,
    minimize: false
  }
};

module.exports = [
  merge(common, devCommon, {
    output: {
      filename: "earthsdk3-cesium.js",
      library: {
        name: 'earthsdk3-cesium',
        type: 'umd'
      },
    },
  }),
  merge(common, devCommon, {
    output: {
      filename: 'earthsdk3-cesium.esm.js',
      library: {
        type: 'module'
      },
    },
    experiments: {
      outputModule: true
    }
  })
];
