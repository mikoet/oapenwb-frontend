// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import {
	ACSearchRequest, ACSearchResult, Direction, SearchRequest, SearchResult, VariantEntry
} from '@app/_models/dict-api';
import { autocompletionsApiPath, searchResultsApiPath } from '@app/_models/dict-api-paths';
import { Response } from '@app/_models/response';
import { environment } from '@environments/environment';

// TODO This should be received from BaseConfig or similar
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

	private _autocompletion = new BehaviorSubject<VariantEntry[]>(null);
	readonly autocompletion = this._autocompletion.asObservable();

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

	constructor(
		private http: HttpClient,
	) {
	}

	performSearch(): Observable<Response<SearchResult>> {
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

	clearSearch(): void {
		this.term = '';
		this._searchResult.next(null);
	}

	requestAutocompletion(): Observable<VariantEntry[]> {
		if (this.term?.length === 0) {
			return of([]);
		}

		// Perform autocompletion request
		const href = `${environment.apiUrl}/${autocompletionsApiPath}/`;
		const requestUrl = `${href}`;

		let acRequest: ACSearchRequest = {
			term: this.term,
			direction: this.direction,
			pair: this._pair,
			maxResults: 5,
		};

		return this.http.post<Response<ACSearchResult>>(requestUrl, acRequest).pipe(
			tap(response => {
				this._autocompletion.next(response.data.entries);
			}),
			map(result => result.data.entries),
		);
	}
}
