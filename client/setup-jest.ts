import { getTestBed } from '@angular/core/testing';
import 'jest-preset-angular/setup-env/zoneless';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting()
);