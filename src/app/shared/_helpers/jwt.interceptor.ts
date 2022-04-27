// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { AccountService } from '@app/shared/_services/account.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor
{
	constructor(private accountService: AccountService)
	{
	}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
	{
		// add auth header with jwt if user is logged in and request is to the api url
		const currentUser = this.accountService.currentUserValue;
		const isLoggedIn = !!currentUser && !!currentUser.token
		const isApiUrl = request.url.startsWith(environment.apiUrl);
		if (isLoggedIn && isApiUrl) {
			request = request.clone({
				setHeaders: {
					Authorization: `Bearer ${currentUser.token}`
				}
			});
		}

		return next.handle(request);
	}
}