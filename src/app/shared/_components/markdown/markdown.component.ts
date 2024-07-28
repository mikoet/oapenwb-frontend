// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'oapenwb-markdown',
	templateUrl: './markdown.component.html',
	styleUrls: ['./markdown.component.scss']
})
export class MarkdownComponent implements OnInit, OnDestroy
{
	@Input('src')
	path: string = undefined;

	@Input()
	locale: string = undefined;

	@Input()
	locales: string[] = undefined;

	// Optional: If not set Transloco's default lang will be used as defaultLocale
	@Input()
	defaultLocale: string = undefined;

	source: string = '';
	activeLocale: string = '';
	destroy$ = new ReplaySubject<void>(1);

	constructor(
		private transloco: TranslocoService,
	) { }

	ngOnInit(): void {
		if (!!this.locale) {
			this.activeLocale = this.locale;
			this.source = `${this.path}.${this.locale}.md`;
		} else if (!!this.locales) {
			if (!this.defaultLocale) {
				this.defaultLocale = this.transloco.getDefaultLang();
			}

			const activeLang = this.transloco.getActiveLang();
			this.updateSource(activeLang);

			this.transloco.langChanges$.pipe(
				takeUntil(this.destroy$),
			).subscribe((locale: string) => {
				this.updateSource(locale);
			});
		}
	}

	private updateSource(locale: string): void {
		if (!this.locales.includes(locale)) {
			locale = this.defaultLocale;
		}
		this.activeLocale = locale;
		this.source = `${this.path}.${locale}.md`;
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
