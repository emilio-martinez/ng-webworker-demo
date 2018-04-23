// @ts-check
const { execSync } = require('child_process');
const process = require('process');
const chalk = require('chalk').default;

const { NgWorkerAppDefinition } = require('./build-ng-webworker-internal');
const namespace = 'build-angular-web-worker';

(async () => {
  /** START */
  console.log(chalk.green(`\r\n<${namespace}>`));

  /** Get all web worker apps */
  const apps = NgWorkerAppDefinition.getApps();

  if (!apps.length) {
    console.warn(chalk.yellow(`No web worker apps found.`));
  } else {
    clearBuildPath();

    for (let app of apps) {
      app.cleanOutDir();
      app.ngcCompile();
      await app.build();
    }
  }

  /** END */
  console.log(chalk.green(`</${namespace}>\r\n`));
})();

/**
 * Clears the `ngc` outDir path
 */
function clearBuildPath() {
  const buildPath = NgWorkerAppDefinition.buildPath;
  console.info(chalk.blue(`Clearing '${buildPath}'.`));
  execSync(`rm -rf ${buildPath}`, { encoding: 'utf8' });
}
