// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { EMPTY } from 'rxjs';

// SPDX-License-Identifier: AGPL-3.0-only
import { HttpClient } from '@angular/common/http';
import { Injectable, NgModule, NgZone, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import {
	provideTransloco,
	Translation, TRANSLOCO_CONFIG, TRANSLOCO_FALLBACK_STRATEGY, TRANSLOCO_LOADER, translocoConfig,
	TranslocoFallbackStrategy, TranslocoLoader, TranslocoModule
} from '@jsverse/transloco';

import { DEFAULT_UI_LOCALE } from './_config/config';
import { ROUTE_MAINTENANCE } from './routes';

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
		provideTransloco({
            config: {
                availableLangs: ['nds', 'de', 'en'],
				defaultLang: DEFAULT_UI_LOCALE,
                reRenderOnLangChange: true,
                prodMode: !isDevMode(),
            },
            loader: TranslocoHttpLoader
        }),
		// TODO Wat is med dee to doon nå den wessel up dat nye transloco?
		// {
		// 	provide: TRANSLOCO_LOADER,
		// 	useClass: TranslocoHttpLoader
		// },
		// {
		// 	provide: TRANSLOCO_FALLBACK_STRATEGY,
		// 	useClass: DictFallbackStrategy
		// },
	]
})
export class TranslocoRootModule { }
