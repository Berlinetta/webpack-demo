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
        externals: {
            "lodash": "_"
        },
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
                                    "node": "current"
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
