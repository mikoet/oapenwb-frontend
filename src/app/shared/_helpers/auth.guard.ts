// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { TranslocoService } from '@ngneat/transloco'
import { AccountService } from '../_services/account.service';

import { getRouteStrWithoutLang } from '../_pipes/routing.pipe';
import { ROUTE_LOGIN } from '@app/routes';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate
{
	constructor(
		private router: Router,
		private transloco: TranslocoService,
		private accountService: AccountService)
	{}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
	{
		const currentUser = this.accountService.currentUserValue;
		// TODO The login check should be enhanced by testing the JWT's validity
		// if (!this.auth.isAuthenticated()) {
		if (currentUser) {
			// logged in so return true
			return true;
		}

		// not logged in so redirect to login page with the return url
		let lang = this.transloco.getActiveLang();
		let url = `/${lang}/` + getRouteStrWithoutLang(ROUTE_LOGIN);
		this.router.navigate([url], { queryParams: { returnUrl: state.url } });
		return false;
	}
}