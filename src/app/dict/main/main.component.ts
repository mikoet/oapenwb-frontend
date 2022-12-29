// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DOCUMENT } from '@angular/common';
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';

/**
 * The MainComponent is the main component of the dictionary's visitor view.
 * It handles:
 * 1. Translation of the page title when the language changes.
 */
@Component({
	selector: 'dict-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy
{
	private destroy$ = new ReplaySubject();

	constructor(
		public transloco: TranslocoService,
		private router: Router,
		private ngZone: NgZone,
		private pageTitle: Title,
		@Inject(DOCUMENT) private document: Document,
	) { }

	ngOnInit(): void {
		this.transloco.langChanges$.pipe(
			takeUntil(this.destroy$),
		).subscribe((locale: string) => {
			this.onLangSelected(locale);
		});

		this.transloco.selectTranslate('pageTitle').pipe(
			takeUntil(this.destroy$),
		).subscribe((value: string) => this.pageTitle.setTitle(value));
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	onLangSelected(locale: string): void {
		// Renavigate to include the active locale into the URL
		const url: string = this.router.url;
		const parts: string[] = url.split('/');
		if (parts.length >= 2) {
			const availableLocales = this.transloco.getAvailableLangs();
			parts[1] = locale;
			if (availableLocales.indexOf(parts[1] as any) == -1) {
				parts[1] = this.transloco.getDefaultLang();
			}
			this.ngZone.runGuarded(async () => await this.router.navigateByUrl(parts.join('/')));
		}
	}
}
