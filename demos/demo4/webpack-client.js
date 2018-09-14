const webpack = require("webpack");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pkg = require("../../package.json");

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

module.exports = () => {
    const libName = pkg.name;
    const config = {
        entry: "./src/index.js",
        target: "node",
        output: {
            filename: `${libName}.js`,
            publicPath: "/assets/",
            chunkFilename: `${libName}-[name]-[chunkhash:10].js`
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
        // externals: {
        //     "axios": "axios",
        //     "bluebird": "Promise",
        //     "es5-shim": "es5-shim",
        //     "lodash": "_",
        //     "react": "React",
        //     "react-dom": "ReactDOM",
        //     "react-redux": "ReactRedux",
        //     "redux": "Redux",
        //     "moment": "moment",
        //     "mdc-datalayer-manager": "ddManager",
        //     "mdc-neptune": "mdcNeptune",
        //     "mdc-neptune-sc": "mdcNeptuneSc",
        //     "mdc-utils": "MdcUtils",
        //     "mdc-apisdk": "mdc_apisdk",
        //     "highcharts": "Highcharts",
        //     "highcharts/highstock": "Highcharts",
        //     "d3": "d3",
        //     "mdc-d3-dagre": "dagreD3",
        //     "prop-types": "PropTypes"
        // },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    include: /src/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                ["env", {
                                    "targets": {
                                        "browsers": ["last 2 versions", "ie 11"]
                                    },
                                    /* when all the mdc packages are using es6 import/export,
                                       we should open the below setting for webpack to use tree shaking
                                       while bundling the code */
                                    //"modules": false,
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
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, 'style-loader', 'css-loader'],
                },
                {
                    test: /\.less$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader?modules&importLoaders=1&localIdentName=neptune_[local]_[hash:base64:5]', 'less-loader']
                },
                {
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
