/* eslint-env node */
const path = require(`path`);
const fs = require(`fs`);
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);
const SpriteLoaderPlugin = require(`svg-sprite-loader/plugin`);
const CssMinimizerPlugin = require(`css-minimizer-webpack-plugin`);
const TerserPlugin = require(`terser-webpack-plugin`);
const RemovePlugin = require(`remove-files-webpack-plugin`);

const Folder = {
  SRC: `source`,
  BUILD: `build`,
  SCRIPTS: `scripts`,
  MARKUP: `markup`,
};

const PUG_FOLDER = `${Folder.MARKUP}/pug/`;
const PUG_DIR = `${Folder.SRC}/${PUG_FOLDER}`;
const PAGES_FOLDER = `${PUG_FOLDER}/pages/`;
const PAGES_DIR = `${Folder.SRC}/${PAGES_FOLDER}`;
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
        removeCR: true,
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
  mode: isDev ? `development` : `production`,
  context: path.resolve(__dirname, Folder.SRC),
  entry: {
    main: path.resolve(__dirname, `./source/index.js`),
  },
  output: {
    path: path.resolve(__dirname, Folder.BUILD),
    publicPath: ``,
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
        test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/i,
        use: {
          loader: `file-loader`,
          options: {
            esModule: false,
            name: `img/[name].[hash].[ext][query]`,
          },
        },
      },
      {
        test: /\.svg$/,
        use: [{
          loader: `svg-sprite-loader`,
          options: {
            extract: true,
            spriteFilename: `img/sprite.[hash].svg`,
          },
        }],
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        use: {
          loader: `file-loader`,
          options: {
            esModule: false,
            name: `fonts/[name].[hash].[ext][query]`,
          },
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
    new RemovePlugin({
      before: {
        test: [
          {
            folder: Folder.BUILD,
            method: () => true
          }
        ],
      },
    }),
    ...PAGES.map((page) => new HtmlWebpackPlugin({
      template: `${PAGES_FOLDER}/${page}`,
      filename: `./${page.replace(/\.pug/, `.html`)}`
    })),
    new MiniCssExtractPlugin({
      filename: `css/style.[name].[contenthash].css`
    }),
    new SpriteLoaderPlugin()
  ],
  devtool: isDev ? `eval-cheap-module-source-map` : `hidden-nosources-source-map`,
  optimization: {
    minimize: isProd,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin()
    ],
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
