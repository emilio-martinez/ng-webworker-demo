import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { WorkerAppModule } from '@angular/platform-webworker';

@NgModule({
  declarations: [AppComponent],
  exports: [AppComponent]
})
export class AppModule {}

@NgModule({
  imports: [AppModule, BrowserModule],
  bootstrap: [AppComponent]
})
export class AppBrowserModule {}

@NgModule({
  imports: [AppModule, WorkerAppModule],
  bootstrap: [AppComponent]
})
export class AppWorkerModule {}
