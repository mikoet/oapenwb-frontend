// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatMenuModule } from '@angular/material/menu'
import { MatListModule } from '@angular/material/list'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { MatCardModule } from '@angular/material/card'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatButtonModule } from '@angular/material/button'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { provideAnimations } from '@angular/platform-browser/animations'
import { BlockUIModule } from 'ng-block-ui'
import { BrowserModule, provideClientHydration } from '@angular/platform-browser'
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http'
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router'
import { provideTransloco } from '@jsverse/transloco'
import { provideMarkdown } from 'ngx-markdown'

import { TranslocoHttpLoader } from '@app/transloco-http-loader'
import { APP_ROUTES } from '@app/app.routes'
import { DEFAULT_UI_LOCALE } from '@app/_config/config'
import { JwtInterceptor } from '@app/shared/_helpers/jwt.interceptor'

const material = [
	MatAutocompleteModule,
	MatButtonModule,
	MatButtonToggleModule,
	MatCardModule,
	MatIconModule,
	MatInputModule,
	MatListModule,
	MatMenuModule,
	MatTooltipModule,
]

/** Http interceptor providers in outside-in order */
const httpInterceptorProviders = [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }]

export const appConfig: ApplicationConfig = {
	providers: [
		importProvidersFrom(
			BrowserModule,
			BlockUIModule.forRoot({
				delayStart: 500,
				//delayStop: 500,
			}),
			FontAwesomeModule,
			FormsModule,
			material,
			ReactiveFormsModule,
		),
		// TODO Interceptor could be rewritten to be functional and provided as param of provideHttpClient()
		httpInterceptorProviders,
		provideHttpClient(withInterceptorsFromDi(), withFetch()),
		provideTransloco({
			config: {
				availableLangs: ['nds', 'de', 'en'],
				defaultLang: DEFAULT_UI_LOCALE,
				reRenderOnLangChange: true,
				prodMode: !isDevMode(),
			},
			loader: TranslocoHttpLoader,
		}),
		provideAnimations(),
		provideRouter(APP_ROUTES, withEnabledBlockingInitialNavigation()),
		provideMarkdown(),
		provideClientHydration(),
	],
}
