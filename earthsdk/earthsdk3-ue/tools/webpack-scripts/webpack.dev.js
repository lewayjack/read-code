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
      filename: "earthsdk3-ue.js",
      library: {
        name: 'earthsdk3-ue',
        type: 'umd'
      },
    }
  }),
  merge(common, devCommon, {
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
