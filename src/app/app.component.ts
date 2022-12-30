// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { ReplaySubject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { DOCUMENT } from '@angular/common';
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';

import { DEFAULT_UI_LOCALE } from './_config/config';

/**
 * The AppComponent handles:
 * 1. The locale part within the URL to be in sync with the set active language: /[locale]/some/path.
 * 2. So it puts a locale part into the URL if there is none yet.
 * 3. Will add / update meta tags to the head tag of index.html. The tags will be taken from UI translation scope 'metaTags'.
 */
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy
{
	private destroy$ = new ReplaySubject<void>(1);

	constructor(
		/*public configService: ConfigService,*/
		@Inject(DOCUMENT) private document: Document,
		private router: Router,
		private zone: NgZone,
		public transloco: TranslocoService,
		private meta: Meta,
	) {
	}

	ngOnInit(): void {
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

					// TODO Should this be taken from BaseConfig?
					const uiLanguages = this.transloco.getAvailableLangs() as string[];
					if (uiLanguages.indexOf(parts[1]) == -1) {
						parts[1] = DEFAULT_UI_LOCALE;
						url = parts.join('/');
					}

					this.zone.run(async () => {
						const locale = parts[1];
						if (locale !== this.transloco.getActiveLang()) {
							// Don't trigger unnecessary 'second change' to same locale
							this.transloco.setActiveLang(locale);
						}
						// TODO this.configService.uiLanguage = this.translate.currentLang;
						await this.router.navigateByUrl(url);
						this.initMeta();
					});
				} else {
					let locale = this.transloco.getActiveLang();
					this.zone.run(async () => await this.router.navigateByUrl(`/${locale}`));
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

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	toggleTheme() {
		this.document.body.classList.toggle('dark-theme');
		this.document.body.classList.toggle('light-theme');
	}

	private setHtmlLang(locale: string): void {
		// Change the value of the <html lang="..."> attribute
		this.document.documentElement.lang = locale;
	}

	private initMeta(): void {
		this.transloco.load(`metaTags/${this.transloco.getActiveLang()}`).pipe(
			take(1),
			takeUntil(this.destroy$),
		).subscribe(translation => {
			for (const key in translation) {
				const matches = key.match(/(itemprop|name|property)='(.*)'/);
				if (!!matches && matches.length === 3) {
					const keyProperty: string = matches[1];
					const keyValue: string = matches[2];
					const content: string = translation[key];

					if (this.meta.getTag(key)) {
						this.meta.updateTag({ [keyProperty]: keyValue, content }, key);
					} else {
						this.meta.addTag({ [keyProperty]: keyValue, content });
					}
				} else {
					console.warn('Retreived invalid meta key', key);
				}
			}
		});
	}
}
