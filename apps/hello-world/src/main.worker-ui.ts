import 'zone.js/dist/zone';
import { enableProdMode } from '@angular/core';
import { bootstrapWorkerUi } from '@angular/platform-webworker';

import { environment } from './environments/environment.prod';

if (environment.production) {
  enableProdMode();
}

bootstrapWorkerUi('app-worker.js').catch(err => console.log(err));
