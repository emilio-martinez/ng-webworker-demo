// @ts-check
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const chalk = require('chalk').default;
const path = require('path');
const process = require('process');

const { CliConfig } = require('@angular/cli/models/config');
const { ModuleConcatenationPlugin } = require('webpack').optimize;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PurifyPlugin = require('@angular-devkit/build-optimizer').PurifyPlugin;
const rxPaths = require('rxjs/_esm5/path-mapping');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

/**
 * Object definition of where certain app worker files can be found
 * @class NgWorkerAppDefinition
 */
class NgWorkerAppDefinition {
  constructor(cliAppDefinition) {
    this.name = cliAppDefinition.name;
    this.root = cliAppDefinition.root;
    this.outDir = cliAppDefinition.outDir;
    this.index = cliAppDefinition.index;
    this.mainWorkerUi = NgWorkerAppDefinition.mainUiFilename;
    this.mainWorker = NgWorkerAppDefinition.mainFilename;
    this.polyfills = cliAppDefinition.polyfills;
    this.tsconfig = NgWorkerAppDefinition.tsconfigFileName;
  }

  fromRoot(filename) {
    return path.join(this.root, filename);
  }

  cleanOutDir() {
    console.info(chalk.blue(`Clearing '${this.outDir}'.`));
    execSync(`rm -rf ${this.outDir}`);
  }

  ngcCompile() {
    const tsconfigPath = this.fromRoot(this.tsconfig);
    console.info(chalk.blue(`Calling 'ngc' on '${tsconfigPath}'.`));
    execSync(`node_modules/.bin/ngc -p ${tsconfigPath}`);
  }

  build() {
    return new Promise((resolve, reject) => {
      const entryPath = path.join(NgWorkerAppDefinition.buildPath, this.root);
      const mainPath = './' + path.join(entryPath, this.mainWorkerUi);
      const workerPath = './' + path.join(entryPath, this.mainWorker);

      webpack(
        [
          webpackAppConfig(this, mainPath),
          webpackAppConfig(this, workerPath, 'app-worker')
        ],
        webpackCallback(resolve, reject)
      );
    });
  }

  static get buildPath() {
    return '_build';
  }

  static get mainFilename() {
    return 'main.worker.js';
  }

  static get mainUiFilename() {
    return 'main.worker-ui.js';
  }

  static get tsconfigFileName() {
    return 'tsconfig.worker.json';
  }

  /**
   * Whether the path has a worker tsconfig
   * @static
   * @param {string} appPath Path to look in
   * @returns {boolean} Whether the path has a worker tsconfig
   */
  static pathHasWorkerTsconfig(appPath) {
    const tsconfigPath = path.join(
      appPath,
      NgWorkerAppDefinition.tsconfigFileName
    );
    // TODO: Verify existence of main files?
    // const mainWorkerPath = path.join(appPath, NgWorkerAppDefinition.mainFilename);
    // const mainWorkerUiPath = path.join(appPath, NgWorkerAppDefinition.mainUiFilename);
    return existsSync(tsconfigPath);
  }

  /**
   * Fetches Angular App Worker Definitions
   * @static
   * @returns {Array<NgWorkerAppDefinition>}
   */
  static getApps() {
    return CliConfig.getValue('apps').reduce((acc, app) => {
      const tsconfigExists = NgWorkerAppDefinition.pathHasWorkerTsconfig(
        app.root
      );
      return tsconfigExists ? acc.concat(new NgWorkerAppDefinition(app)) : acc;
    }, []);
  }
}

/**
 * Create a Webpack config baed on an app
 * @param {NgWorkerAppDefinition} app
 * @param {string} entry
 * @param {string} [name='main']
 * @returns {webpack.Configuration}
 */
function webpackAppConfig(app, entry, name = 'main') {
  const entryPath = path.join(NgWorkerAppDefinition.buildPath, app.root);
  const outputPath = path.join(process.cwd(), app.outDir);
  const templatePath = path.join(app.root, app.index);
  const templateTitle = app.name;
  const isMain = name === 'main';

  return {
    entry: entry,
    output: {
      path: outputPath,
      filename: `${name}.js`
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: '@angular-devkit/build-optimizer/webpack-loader',
          options: {
            sourceMap: false
          }
        }
      ]
    },
    plugins: [
      new webpack.ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators for Windows and MacOS
        /(.+)?angular(\\|\/)core(.+)?/,
        // location of src
        path.dirname(entryPath),
        // A map of the routes
        {}
      ),
      isMain
        ? new HtmlWebpackPlugin({
            template: templatePath,
            filename: 'index.html',
            cache: true,
            showErrors: true,
            title: templateTitle,
            xhtml: true
          })
        : null,
      new ModuleConcatenationPlugin(),
      new PurifyPlugin(),
      new UglifyJsPlugin({
        test: /\.js(\?.*)?$/i,
        extractComments: false,
        sourceMap: true,
        cache: true,
        parallel: true,
        uglifyOptions: {
          output: {
            ascii_only: true,
            comments: false,
            webkit: true
          },
          ecma: 5,
          warnings: false,
          ie8: false,
          mangle: {
            safari10: true
          },
          compress: {
            typeofs: false,
            pure_getters: true,
            passes: 3
          }
        }
      })
    ].filter(p => p),
    resolve: {
      extensions: ['.ts', '.js'],
      symlinks: true,
      alias: rxPaths(),
      mainFields: ['browser', 'module', 'main']
    },
    resolveLoader: {
      alias: rxPaths()
    }
  };
}

function webpackCallback(resolve, reject) {
  /**
   * @param {Error} err
   * @param {webpack.Stats} stats
   */
  function cb(err, stats) {
    if (err) {
      return reject(err.stack || err);
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }

    const webpackResult = stats.toString({
      chunks: false,
      colors: true,
      modules: false
    });

    console.log('\r\n', webpackResult, '\r\n');
    resolve();
  }

  return cb;
}

module.exports = {
  NgWorkerAppDefinition
};
