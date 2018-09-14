const webpack = require("webpack");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// 'eventlistener',
// 'cellblock',
// 'mdc-classnames'

const sharedPlugins = [
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.optimize.LimitChunkCountPlugin({
    maxChunks: 15
  }),
  new webpack.optimize.MinChunkSizePlugin({
    minChunkSize: 10000
  })
];

const devPlugins = [
  new MiniCssExtractPlugin({
    filename: "mdc-neptune.css",
  }),
  new ManifestPlugin(),
  new CaseSensitivePathsPlugin(),
  new webpack.DefinePlugin({__SERVER_RENDERING__: false, __PRODUCTION__: false}),
  new webpack.LoaderOptionsPlugin({
    debug: true
  }),
  ...sharedPlugins
];

const getServerConfig = () => {
  const config = {
    entry: "./src/index.js",
    target: "node",
    output: {
      filename: `mdc-neptune.js`
      //publicPath: "/assets/",
      //chunkFilename: `${libName}-[name]-[chunkhash:10].js`
    },
    cache: true,
    devtool: "source-map",
    node: {
      fs: "empty"
    },
    stats: {
      colors: true,
      reasons: true
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
          }
        }
      }
    },
    plugins: devPlugins,
    resolve: {
      extensions: [".js", ".jsx", ".json"]
    },
    externals: {
      "lodash": "_",
      "react": "React",
      "react-dom": "ReactDOM",
      "moment": "moment",
      "prop-types": "PropTypes"
    },
    module: {
      rules: [{
        test: /\.js$/,
        include: /src/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["env", {
                "node": "current"
              }],
              "stage-2",
              "react"
            ]
          }
        }
      }, {
        test: /\.css/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader?modules&importLoaders=1&localIdentName=neptune_[local]_[hash:base64:5]'
        ]
      }, {
        test: /\.less/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader?modules&importLoaders=1&localIdentName=neptune_[local]_[hash:base64:5]',
          'less-loader'
        ]
      }, {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }]
    }
  };

  return config;
};

const getClientConfig = () => {
  const config = getServerConfig();
  config.target = "web";
  config.module.rules[0].use.options = {
    presets: [
      ["env", {
        "targets": {
          "browsers": ["last 2 versions", "ie 11"]
        },
        "node": "current",
        "useBuiltIns": "usage"
      }],
      "stage-2",
      "react"
    ],
    "plugins": [
      ["transform-runtime", {
        "helpers": false,
        "polyfill": false,
        "regenerator": true
      }]
    ]
  };
  return config;
};

module.exports = {getServerConfig, getClientConfig};
