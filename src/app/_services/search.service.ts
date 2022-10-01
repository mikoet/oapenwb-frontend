// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Direction, SearchRequest, SearchResult } from '@app/_models/dict-api';
import { searchResultsApiPath } from '@app/_models/dict-api-paths';
import { Response } from '@app/_models/response';

export const LANG_PAIRS = [
	'nds-de',
	'nds-en',
	'nds-nl',
	'-',
	'nds-da',
	'nds-fi',
	'nds-sv',
	'-',
	'nds-*',
];

@Injectable({
	providedIn: 'root'
})
export class SearchService
{
	private _searchResult = new BehaviorSubject<SearchResult>(null);
	//private store: { lexemes: LexemeSlimDTO[] } = { lexemes: [] };
	readonly searchResult = this._searchResult.asObservable();

	//
	public term: string = '';
	private _pair: string = 'nds-de';
	public get pair(): string {
		return this._pair;
	}
	public set pair(value: string) {
		if (value !== '-' && LANG_PAIRS.includes(value)) {
			this._pair = value;
		}
	}
	public direction: Direction = 'Both';

	constructor(private http: HttpClient)
	{
	}

	performSearch(): Observable<Response<SearchResult>>
	{
		const href = `${environment.apiUrl}/${searchResultsApiPath}/`;
		const requestUrl = `${href}`;

		let searchRequest: SearchRequest = {
			term: this.term,
			direction: this.direction,
			pair: this._pair
		};

		return this.http.post<Response<SearchResult>>(requestUrl, searchRequest).pipe(
			tap(response => {
				this._searchResult.next(response.data);
			}),
			// TODO error handling?
		);
	}
}
