// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { SearchRequest, SearchResult } from '@app/_models/dict-api';
import { searchResultsApiPath } from '@app/_models/dict-api-paths';
import { Response } from '@app/_models/response';

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
	public pair: string = 'nds-de';

	constructor(private http: HttpClient)
	{
	}

	performSearch(): void
	{
		const href = `${environment.apiUrl}/${searchResultsApiPath}/`;
		const requestUrl = `${href}`;

		let searchRequest: SearchRequest = {
			term: this.term,
			direction: 'Both',
			pair: this.pair
		};

		this.http.post<Response<SearchResult>>(requestUrl, searchRequest).subscribe(
			response => {
				//this.store.lexemes = response.data;
				this._searchResult.next(response.data);
			},
			// TODO this should also stop the blocking and give an error
			error => console.warn('Could not load lexemes.')
		);
	}
}
