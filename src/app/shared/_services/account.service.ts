// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {isPlatformBrowser} from '@angular/common';

import { environment } from '@environments/environment';
import { isResponse } from '@app/_models/response';
import { User } from '@app/_models/user';
import { KeyMap } from '@app/util/hashmap';

export type ActionType = "Login" | "Logout";

@Injectable({
	providedIn: 'root'
})
export class AccountService {
	private currentUserSubject: BehaviorSubject<User>;
	public readonly currentUser: Observable<User>;

	// Maps an registrant (e.g. the LexemeService) to a hook in form of a function
	private actionHooks: KeyMap<(action: ActionType) => void> = new KeyMap();

	constructor(
		private http: HttpClient,
		@Inject(PLATFORM_ID) private platformId: any
	)
	{
		let currentUser: any = undefined;
		if (isPlatformBrowser(platformId)) {
			currentUser = JSON.parse(localStorage.getItem('currentUser'));
		}
		this.currentUserSubject = new BehaviorSubject<User>(currentUser);
		this.currentUser = this.currentUserSubject.asObservable();
	}

	public get currentUserValue(): User
	{
		return this.currentUserSubject.value;
	}

	register(firstname: string, lastname: string, username: string|null, email: string, token: string, password: string,
		locale: string): Observable<any>
	{
		return this.http.post<any>(`${environment.apiUrl}/users/register`,
			{
				firstname: firstname,
				lastname: lastname,
				username: username,
				email: email,
				token: token,
				password: password,
				//locale: `${DEFAULT_UI_LOCALE}`
			}).pipe(
				/*share(),*/
				catchError(this.handleError),
				map(result => {
					if (isResponse(result)) {
						if (result.status == 'error') {
							throw result.message;
						} else if (result.status == 'success') {
							let user = { currentUser: result.data };
							localStorage.setItem('currentUser', JSON.stringify(user));
							this.currentUserSubject.next(result.data);
							return result.data;
						}
					}
				}));
	}

	login(identifier: string, password: string): Observable<any>
	{
		return this.http.post<any>(`${environment.apiUrl}/users/login`, { identifier: identifier, password: password })
			.pipe(
				/*share(),*/
				catchError(this.handleError),
				map(result => {
					if (isResponse(result)) {
						if (result.status == 'error') {
							throw result.message;
						} else if (result.status == 'success') {
							let user = result.data;
							localStorage.setItem('currentUser', JSON.stringify(user));
							this.currentUserSubject.next(result.data);
							return result.data;
						}
					}
				}));
	}

	logout()
	{
		// remove user from local storage to log user out
		localStorage.removeItem('currentUser');
		this.currentUserSubject.next(null);
		this.callActionHooks('Logout');
	}

	private handleError(error: HttpErrorResponse)
	{
		if (error.error instanceof ErrorEvent) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error('An error occurred:', error.error.message);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong,
			console.error(
				`Backend returned code ${error.status}, ` +
				`body was: `, error.error);
		}
		// return an observable with a user-facing error message
		return throwError(
			'We\'re sorry. There is a technical problem.');
	};

	public registerActionHook(registrant: string, hook: (a: ActionType) => void) : void
	{
		// For the case the service was already registered
		this.actionHooks.remove(registrant);
		this.actionHooks.add(registrant, hook);
	}

	private callActionHooks(action: ActionType) : void
	{
		// Call the hooks of all registrants
		for (let registrant of this.actionHooks.keys) {
			let hook = this.actionHooks.get(registrant);
			hook(action);
		}
	}
}