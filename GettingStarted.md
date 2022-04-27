<!-- SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com> -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Getting started

## Run for development

Run `ng serve` (standard Angular) ~~or `npm run dev:ssr` (Angular Universal)~~ for a dev server. Navigate to `http://localhost:4200/`.
The app will automatically reload if you change any of the source files.

**22-01-13:** `ng serve --host=127.0.0.1` must be used for node 17 in order to be able to debug the app in the browser.


## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

The build for the development stage of ULE.DK was made via `ng build --configuration=server-dev`.


## Running unit tests

~~Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).~~


## Running end-to-end tests

~~Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).~~


## Running static code analysis

~~`npx ng lint codict` will run a static code analysis.~~
For upgrading see: https://github.com/angular-eslint/angular-eslint#migrating-from-codelyzer-and-tslint


## Dealing with Transloco (localization of this app)

### Extracting transloco keys from source code (.html + .ts)
`npm run i18n:extract`

### Running the detective
`npm run i18n:find`

More about the detective:
https://www.npmjs.com/package/@ngneat/transloco-keys-manager#-installation


## What else to say

For better a *import experience* in TypeScript sources, the paths **@app** and **@environment** were added to `tsconfig.json`.


## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
