// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { enableProdMode } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'

import { AppComponent } from '@app/app.component'
import { appConfig } from '@app/app.config'
import { environment } from '@environments/environment'

if (environment.production) {
	enableProdMode()
}

document.addEventListener('DOMContentLoaded', () => {
	bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err))
})
