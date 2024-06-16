// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { TranslocoService } from '@ngneat/transloco'
import { AccountService } from '../_services/account.service';

import { getRouteStrWithoutLang } from '../_pipes/routing.pipe';
import { ROUTE_LOGIN } from '@app/routes';

export const ADMIN_AUTH_FN = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const router: Router = inject(Router);
	const transloco: TranslocoService = inject(TranslocoService);
	const accountService: AccountService = inject(AccountService);

	const currentUser = accountService.currentUserValue;
	// TODO The login check should be enhanced by testing the JWT's validity
	// if (!this.auth.isAuthenticated()) {
	if (currentUser) {
		// logged in so return true
		return true;
	}

	// not logged in so redirect to login page with the return url
	const lang = transloco.getActiveLang();
	const url = `/${lang}/` + getRouteStrWithoutLang(ROUTE_LOGIN);
	router.navigate([url], { queryParams: { returnURL: state.url } });

	return false;
}
