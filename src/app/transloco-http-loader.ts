// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { EMPTY } from 'rxjs';

import { DEFAULT_UI_LOCALE } from './_config/config';
import { ROUTE_MAINTENANCE } from './routes';

const NO_L10N_AVAILABLE: string = 'no_l10n'

/**
 * Loads the translation from the API/backend via the configured path.
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
