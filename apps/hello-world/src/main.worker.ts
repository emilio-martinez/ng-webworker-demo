import 'zone.js/dist/zone';
import { enableProdMode } from '@angular/core';
import { platformWorkerApp } from '@angular/platform-webworker';

import { AppWorkerModuleNgFactory } from './app/app.module.ngfactory';
import { environment } from './environments/environment.prod';

if (environment.production) {
  enableProdMode();
}

platformWorkerApp()
  .bootstrapModuleFactory(AppWorkerModuleNgFactory)
  .catch(err => console.log(err));
