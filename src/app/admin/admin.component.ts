// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { MediaMatcher } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, isDevMode, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { TranslocoService } from '@ngneat/transloco';

import { AccountService } from '@app/shared/_services/account.service';
import { getRouteStrWithoutLang } from '@app/shared/_pipes/routing.pipe';
import { ROUTE_LOGIN } from '@app/routes';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy
{
	mobileQuery: MediaQueryList;
	private _mobileQueryListener: () => void;

	/*fillerContent = Array.from({length: 5}, () =>
		`Hyr steit en körten byspiltekst, den eyn later noch wegdoon kan.`);*/

	constructor(
		changeDetectorRef: ChangeDetectorRef,
		media: MediaMatcher,
		@Inject(DOCUMENT) private document: Document,
		public transloco: TranslocoService,
		private router: Router,
		private account: AccountService)
	{
		this.mobileQuery = media.matchMedia('(max-width: 1000px)');
		this._mobileQueryListener = () => changeDetectorRef.detectChanges();
		this.mobileQuery.addEventListener('change', this._mobileQueryListener);

		this.loadStyle('styles-admin');
	}

	ngOnInit(): void
	{
	}

	ngOnDestroy(): void
	{
		this.mobileQuery.removeEventListener('change', this._mobileQueryListener);

		// Remove the theme link element from Head
		let themeLink = this.document.getElementById('client-theme');
		const head = this.document.getElementsByTagName('head')[0];
		if (head !== undefined) {
			head.removeChild(themeLink);
		}
	}

	// TODO This does not yet seem to work properly with Angular Universal as the Admin CSS
	//      does not correctly reach the browser
	// from: https://juristr.com/blog/2019/08/dynamically-load-css-angular-cli/
	// TODO !!! Das Elemente bei ngOnDestroy() wieder entfernen.
	private loadStyle(styleName: string)
	{
		const head = this.document.getElementsByTagName('head')[0];

		let themeLink = this.document.getElementById(
			'client-theme'
		) as HTMLLinkElement;
		if (themeLink) {
			// TODO Unterscheidung nach script/style, und auch hier .js?
			// Dieser Zweig kann eig. nicht mehr erreicht werden, da das Element in ngOnDestroy
			// nun wieder entfernt wird.
			themeLink.href = `${styleName}.css`;
		} else {
			// Since Angular 12 (or 11, did not test this well enough) the style sheets get deployed directly as .css
			/*if (isDevMode()) {
				// Loading for development mode
				const script = this.document.createElement('script');
				script.id = 'client-theme';
				script.type = 'text/javascript';
				script.src = `${styleName}.js`;

				head.appendChild(script);
			} else {*/
				const style = this.document.createElement('link');
				style.id = 'client-theme';
				style.rel = 'stylesheet';
				style.href = `${styleName}.css`;
	
				head.appendChild(style);
			//}
		}
	}

	onUiLanguageClicked(lang: string): void
	{
		this.transloco.setActiveLang(lang);
	}

	onLogoutClicked(): void
	{
		this.account.logout();
		// Redirect to login page
		let lang = this.transloco.getActiveLang();
		let url = `/${lang}/` + getRouteStrWithoutLang(ROUTE_LOGIN);
		this.router.navigate([url], { queryParams: { returnUrl: this.router.routerState.snapshot.url } });
	}
}