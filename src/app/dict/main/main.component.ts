// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

/**
 * The MainComponent is the main component of the dictionary's visitor view.
 * It handles:
 * 1. Translation of the page title when the language changes.
 */
@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy
{
	private langChange: Subscription;

	hideMenu: boolean = true;

	constructor(
		public transloco: TranslocoService,
		private pageTitle: Title,
		@Inject(DOCUMENT) private document: Document,
		private router: Router)
	{}

	ngOnInit(): void
	{
		this.langChange = this.transloco.langChanges$.subscribe((locale: string) => {
			this.setPageTitle();
		});

		// Initialize the 
		this.setPageTitle();
	}

	private setPageTitle() : void
	{
		// Translate the page title
		this.pageTitle.setTitle(this.transloco.translate('p.title'));
	}

	ngOnDestroy(): void
	{
		this.langChange.unsubscribe();
	}

	toggleMenu(): void
	{
		this.hideMenu = !this.hideMenu;
	}

	/*
	onLangSelected(event) {
		// Reroute/navigate to the selected lang code
		let url: string = this.router.url;
		let parts: string[] = url.split('/');
		if (parts.length >= 2) {
			// If the language in the URL is not one of the uiLanguages array, then
			// set a different language
			// Todo Fixme The array should be taken from BaseConfig and the default
			// language from the browser for human users
			let uiLanguages: string[] = ['de', 'nl', 'en', 'nds', 'nds-SASS'];
			parts[1] = event.value;
			if (uiLanguages.indexOf(parts[1]) == -1) {
				parts[1] = 'en';
			}
			url = parts.join('/');
			this.router.navigateByUrl(url);
		}
	}
	*/
}