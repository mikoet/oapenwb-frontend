// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { BehaviorSubject, EMPTY, Observable, ReplaySubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { Message } from '@app/_models/message';
import { PaginatedResponse, Pagination, Response } from '@app/_models/response';
import { AccountService } from '@app/shared/_services/account.service';
import { environment } from '@environments/environment';

import {
	FilterOptions, LexemeDetailedDTO, LexemeSlimDTO, LSearchRequest, TextSearchType
} from '../_models/admin-api';
import { lexemesApiPath } from '../_models/admin-api-paths';

/**
 * The LexemeQueryService...
 */
@Injectable()
export class LexemeQueryService
{
	private _lexemes = new BehaviorSubject<LexemeSlimDTO[]>([]);
	private store: { lexemes: LexemeSlimDTO[] } = { lexemes: [] };
	readonly lexemes = this._lexemes.asObservable();

	private _pagination = new BehaviorSubject<Pagination>(null);
	readonly pagination = this._pagination.asObservable();

	private _error = new ReplaySubject<Message|string>(1);
	readonly error = this._error.asObservable();

	// this is used as model in the ListComponent
	public filter: string = '';
	// this is used as model in the FilterMenuComponent
	public searchType: TextSearchType = 'PostgreWeb';
	// this will also be set in the ListComponent
	public filterOptions: FilterOptions = null;

	constructor(private http: HttpClient, private readonly accountService: AccountService) {
		accountService.registerActionHook("LexemeQueryService", action => {
			if (action == 'Logout') {
				console.log('Logout in LexemeQueryService');
				this.store.lexemes = [];
				this._lexemes.next(this.store.lexemes);
				
				this._pagination.next(null);

				this.filter = '';
				this.searchType = 'PostgreWeb';
				this.filterOptions = null;
			}
		});
	}

	loadAndKeep(offset: number = 0, limit: number = 20): void {
		const href = `${environment.apiUrl}/admin/${lexemesApiPath}/`;
		const requestUrl = `${href}?filter=${this.filter}&offset=${offset}&limit=${limit}`;

		let searchRequest: LSearchRequest = {
			filter: this.filter,
			textSearchType: this.searchType,
			offset: offset,
			limit: limit,
			options: this.filterOptions
		};

		this.http.patch<PaginatedResponse<LexemeSlimDTO[]>>(requestUrl, searchRequest).subscribe(
			response => {
				if (response?.status === 'success') {
					this.store.lexemes = response.data;
					this._lexemes.next(Object.assign({}, this.store).lexemes);
					this._pagination.next(response.pagination);
					this._error.next(null);
				} else {
					this.store.lexemes = null;
					this._lexemes.next(null);
					this._pagination.next(null);

					if (response?.status === 'error') {
						this._error.next(response.message);
					} else {
						this._error.next('Some error occured.');
					}
				}
			},
			// TODO this should also stop the blocking and give an error
			error => console.warn('Could not load lexemes.')
		);
	}

	public getSlimDTO(id: number) : LexemeSlimDTO
	{
		let result = null;
		if (this.store.lexemes !== null) {
			for (let slimDTO of this.store.lexemes) {
				if (slimDTO.id === id) {
					return slimDTO;
				}
			}
		}
		return result;
	}

	loadTransient(filter: string, filterOptions: FilterOptions = null, offset: number = 0, limit: number = 50, textSearchType: TextSearchType = 'Prefixed')
		: Observable<PaginatedResponse<LexemeSlimDTO[]>>
	{
		const href = `${environment.apiUrl}/admin/${lexemesApiPath}/`;
		const requestUrl = `${href}`;

		let searchRequest: LSearchRequest = {
			filter: filter,
			textSearchType: textSearchType,
			offset: offset,
			limit: limit,
			options: filterOptions
		};

		return this.http.patch<PaginatedResponse<LexemeSlimDTO[]>>(requestUrl, searchRequest);
	}

	protected handleError(error: HttpErrorResponse)
	{
		/*
		this.isLoadingResults = false;
		this.blockUI.stop();

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
		this.addError('We\'re sorry. There is a technical problem.');
		*/
		// return an observable with a user-facing error message
		//return throwError('We\'re sorry. There is a technical problem.');

		// If you want to return a new response:
        //return of(new HttpResponse({body: [{name: "Default value..."}]}));

        // If you want to return the error on the upper level:
        //return throwError(error);
		return EMPTY;
	};

	public loadByID(id: number): Observable<LexemeDetailedDTO>
	{
		const href = `${environment.apiUrl}/admin/${lexemesApiPath}`;
		// TODO Is there any error handling and checking of the loaded entity that I should do?
		return this.http.get<Response<LexemeDetailedDTO>>(`${href}/${id}`)
			.pipe(
				map(response => {
					if (response.status == 'success') {
						return response.data;
					}
					// TODO An error can occur here like code 11001, message 'Could not perform operation {{operation}} for type {{entity}} on database.'
					//      That should then be shown in the snackbar or somewhere else.
					console.error('Loading lexeme by ID failed (ID and message following):', id, response.message);
					throw new Error('Loading lexeme failed. ID: ' + id);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error))
			);
	}

	public loadSlimByID(id: number): Observable<LexemeSlimDTO>
	{
		const href = `${environment.apiUrl}/admin/${lexemesApiPath}/slim`;
		// TODO Is there any error handling and checking of the loaded entity that I should do?
		return this.http.get<Response<LexemeSlimDTO>>(`${href}/${id}`)
			.pipe(
				map(response => {
					if (response.status == 'success') {
						return response.data;
					}
					console.error('Loading slim lexeme by ID failed (ID and message following):', id, response.message);
					throw new Error('Loading slim lexeme failed. ID: ' + id);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error))
			);
	}

	/*
	create(todo: LexemeDetailedDTO) {
		this.http
			.post<LexemeDetailedDTO>(`${this.baseUrl}/${lexemesApiPath}`, JSON.stringify(todo))
			.subscribe(
				data => {
					this.dataStore.todos.push(data);
					this._todos.next(Object.assign({}, this.dataStore).todos);
				},
				error => console.log('Could not create todo.')
			);
	}

	update(todo: LexemeDetailedDTO) {
		this.http
			.put<LexemeDetailedDTO>(`${this.baseUrl}/${lexemesApiPath}/${todo.id}`, JSON.stringify(todo))
			.subscribe(
				data => {
					this.dataStore.todos.forEach((t, i) => {
						if (t.id === data.id) {
							this.dataStore.todos[i] = data;
						}
					});

					this._lexemes.next(Object.assign({}, this.dataStore).todos);
				},
				error => console.log('Could not update todo.')
			);
	}

	remove(todoId: number) {
		this.http.delete(`${this.baseUrl}/${lexemesApiPath}/${todoId}`).subscribe(
			response => {
				this.dataStore.lexemes.forEach((t, i) => {
					if (t.id === todoId) {
						this.dataStore.lexemes.splice(i, 1);
					}
				});

				this._lexemes.next(Object.assign({}, this.dataStore).lexemes);
			},
			error => console.log('Could not delete todo.')
		);
	}
	*/
}