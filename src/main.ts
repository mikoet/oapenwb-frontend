// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BlockUIModule } from 'ng-block-ui';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { AppComponent } from '@app/app.component';
import { SharedModule } from '@app/shared/shared.module';
import { TranslocoHttpLoader } from '@app/transloco-http-loader';
import { APP_ROUTES } from '@app/app.routes';
import { DEFAULT_UI_LOCALE } from '@app/_config/config';
import { environment } from '@environments/environment';

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
];

if (environment.production) {
	enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
	bootstrapApplication(AppComponent, {
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
				SharedModule,
			),
			provideHttpClient(withInterceptorsFromDi()),
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
		]
	}).catch(err => console.error(err));
});
