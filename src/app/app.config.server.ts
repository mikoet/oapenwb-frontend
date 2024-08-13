// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { mergeApplicationConfig, ApplicationConfig } from '@angular/core'
import { provideServerRendering } from '@angular/platform-server'
import { appConfig } from './app.config'

const serverConfig: ApplicationConfig = {
	providers: [provideServerRendering()],
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
