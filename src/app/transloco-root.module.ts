// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { HttpClient } from '@angular/common/http';
import {
	TRANSLOCO_LOADER,
	Translation,
	TranslocoLoader,
	TranslocoFallbackStrategy,
	TRANSLOCO_FALLBACK_STRATEGY,
	TRANSLOCO_CONFIG,
	translocoConfig,
	TranslocoModule,
} from '@ngneat/transloco';
import { Injectable, NgModule, NgZone } from '@angular/core';
import { environment } from '@environments/environment';
import { EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { ROUTE_MAINTENANCE } from './routes';
import { DEFAULT_UI_LOCALE } from './_config/config';

const NO_L10N_AVAILABLE: string = 'no_l10n'

/**
 * This loader exists to get the translation from the API/backend via the used path.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader
{
	constructor(
		private http: HttpClient,
		private router: Router,
		private zone: NgZone,
	) { }

	getTranslation(lang: string) {
		if (lang !== null && lang !== undefined && lang.endsWith(NO_L10N_AVAILABLE)) {
			this.zone.run(async () => {
				await this.router.navigateByUrl(`/${DEFAULT_UI_LOCALE}/${ROUTE_MAINTENANCE.path}`);
			});
			return EMPTY;
		}
		const path = `${environment.apiUrl}/l10n/${lang}`;
		return this.http.get<Translation>(path);
	}
}

export class DictFallbackStrategy implements TranslocoFallbackStrategy
{
	getNextLangs(failedLang: string) {
		return [NO_L10N_AVAILABLE];
	}
}

@NgModule({
	exports: [TranslocoModule],
	providers: [
		{
			provide: TRANSLOCO_CONFIG,
			useValue: translocoConfig({
				availableLangs: ['nds', 'de', 'en'],
				defaultLang: DEFAULT_UI_LOCALE,
				reRenderOnLangChange: true,
				prodMode: environment.production,
			})
		},
		{
			provide: TRANSLOCO_LOADER,
			useClass: TranslocoHttpLoader
		},
		{
			provide: TRANSLOCO_FALLBACK_STRATEGY,
			useClass: DictFallbackStrategy
		}
	]
})
export class TranslocoRootModule { }
