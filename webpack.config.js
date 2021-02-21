/* eslint-env node */
const path = require(`path`);
const fs = require(`fs`);
const {CleanWebpackPlugin} = require(`clean-webpack-plugin`);
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);
const CssMinimizerPlugin = require(`css-minimizer-webpack-plugin`);

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const publicPath = require(resolveApp(`package.json`)).homepage;

const Folder = {
  SRC: `source`,
  BUILD: `build`,
  SCRIPTS: `scripts`,
  MARKUP: `markup`,
};

const PUG_DIR = `${Folder.SRC}/${Folder.MARKUP}/pug/`;
const PAGES_DIR = `${PUG_DIR}/pages/`;
const PAGES = fs.readdirSync(PAGES_DIR).filter((fileName) => fileName.endsWith(`.pug`));

const isProd = process.argv
  .filter((arg) => arg.includes(`--mode`))
  .reduce((result, arg) => arg.split(`=`)[1], null) === `production`;
const isDev = !isProd;

const getStyleConfig = () => {
  const loaders = [
    {
      loader: `css-loader`,
      options: {
        sourceMap: isDev,
      }
    },
    {
      loader: `postcss-loader`,
      options: {
        postcssOptions: {
          plugins: [
            require(`autoprefixer`),
            require(`cssnano`)({
              preset: [
                `default`,
                {
                  discardComments: {
                    removeAll: true
                  }
                }
              ]
            })
          ],
          sourceMap: isDev,
        },
        sourceMap: isDev,
      },
    },
    {
      loader: `resolve-url-loader`,
      options: {
        sourceMap: isDev,
      },
    },
    {
      loader: `sass-loader`,
      options: {
        sourceMap: true
      }
    }
  ];

  const devStyleLoader = `style-loader`;

  const prodStyleLoader = {
    loader: MiniCssExtractPlugin.loader,
    options: {
      publicPath: (resourcePath, context) => {
        return `${path.relative(path.dirname(resourcePath), context)}/`;
      },
    },
  };

  if (isProd) {
    return [
      prodStyleLoader,
      ...loaders
    ];
  }

  return [
    devStyleLoader,
    ...loaders
  ];
};

module.exports = {
  target: isDev ? `web` : `browserslist`,
  entry: {
    main: path.resolve(__dirname, `${Folder.SRC}/index.js`),
  },
  output: {
    path: path.resolve(__dirname, Folder.BUILD),
    publicPath: isDev ? `/` : publicPath,
    filename: `js/[name].[contenthash].bundle.js`,
    assetModuleFilename: `static/[hash][ext][query]`,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [`babel-loader`],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|svg|webp)$/i,
        type: `asset/resource`,
        generator: {
          filename: `img/[hash][ext][query]`,
        },
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        type: `asset/resource`,
        generator: {
          filename: `fonts/[hash][ext][query]`,
        },
      },
      {
        test: /\.(scss|css)$/,
        use: getStyleConfig(),
      },
      {
        test: /\.pug$/,
        loader: `pug-loader`
      }
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    ...PAGES.map((page) => new HtmlWebpackPlugin({
      template: `${PAGES_DIR}/${page}`,
      filename: `./${page.replace(/\.pug/, `.html`)}`
    })),
    new MiniCssExtractPlugin({
      filename: `css/style.[name].[contenthash].css`,
      chunkFilename: `[id].css`,
    }),
  ],
  devtool: isDev ? `eval-cheap-source-map` : false,
  optimization: {
    minimize: isProd,
    minimizer: [new CssMinimizerPlugin()],
    runtimeChunk: {
      name: `runtime`,
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  devServer: {
    contentBase: [path.join(__dirname, Folder.BUILD), PUG_DIR],
    watchContentBase: true,
    port: 8768,
    open: true,
    historyApiFallback: true,
  },
};
