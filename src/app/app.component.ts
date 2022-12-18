// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { ReplaySubject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DEFAULT_UI_LOCALE } from './_config/config';

/**
 * The AppComponent handles:
 * 1. The locale part within the URL to be in sync with the set active language: /[locale]/some/component.
 * 2. So put a locale part into the URL if there is none yet.
 */
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy
{
	private destroy$ = new ReplaySubject();

	constructor(
		/*public configService: ConfigService,*/
		@Inject(DOCUMENT) private document: Document,
		private router: Router,
		public transloco: TranslocoService)
	{
	}

	ngOnInit(): void
	{
		this.router.events.pipe(
			takeUntil(this.destroy$),
		).subscribe(event => {
			if (event instanceof NavigationEnd) {
				let url: string = this.router.url;
				let parts: string[] = url.split('/');
				if (parts.length >= 2) {
					// If the language in the URL is not one of the uiLanguages array, then
					// set a different language
					// Todo Fixme The array should be taken from BaseConfig and the default
					// language from the browser for human users
					let uiLanguages: string[] = ['de', 'nl', 'en', 'nds', 'nds-SASS'];
					if (uiLanguages.indexOf(parts[1]) == -1) {
						parts[1] = DEFAULT_UI_LOCALE;
						url = parts.join('/');
					}
					this.transloco.setActiveLang(parts[1]);
					// TODO this.configService.uiLanguage = this.translate.currentLang;
					this.router.navigateByUrl(url);
				} else {
					let locale = this.transloco.getActiveLang();
					this.router.navigateByUrl(`/${locale}`);
				}
			}
		});

		this.transloco.langChanges$.pipe(
			takeUntil(this.destroy$),
		).subscribe((locale: string) => {
			this.setHtmlLang(locale);
		});

		// Initialize the 
		this.setHtmlLang(this.transloco.getActiveLang());
	}

	private setHtmlLang(locale: string) : void
	{
		// Change the value of the <html lang="..."> attribute
		this.document.documentElement.lang = locale;
	}

	ngOnDestroy(): void
	{
		this.destroy$.next();
		this.destroy$.complete();
	}

	toggleTheme()
	{
		this.document.body.classList.toggle('dark-theme');
		this.document.body.classList.toggle('light-theme');
	}
}