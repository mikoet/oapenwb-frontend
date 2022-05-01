// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NumericKeyMap } from '@app/util/hashmap';
import { Response } from '@app/_models/response';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { sememesApiPath } from '../_models/admin-api-paths';
import { Sememe, SememeSlim, SSearchRequest, SSearchResult, TextSearchType } from '../_models/admin-api';
import { ApiAction } from '../_models/enums';

@Injectable({
	providedIn: 'root'
})
export class SememeService
{
	private nextSememeID: number = -1;
	/**
	 * This cache is for storing the Sememe that were just created over this service
	 * and got a negative ID. This makes it possible for this service to return this unpersistent
	 * SynGroups by the method #loadByID(id:number).
	 * The downside is that currently SynGroups are not getting removed after having been
	 * persisted which is a small 'memory leak'.
	 */
	private cache: NumericKeyMap<Sememe> = new NumericKeyMap();
	private slimCache: NumericKeyMap<SememeSlim> = new NumericKeyMap();

	public resetSlimCache() : void
	{
		this.slimCache = new NumericKeyMap(); 
	}
	public addSlimToCache(sememe: SememeSlim) : void
	{
		if (!!sememe && !this.slimCache.get(sememe.id)) {
			this.slimCache.add(sememe.id, sememe);
		}
	}
	public getCachedSlim(id: number) : SememeSlim
	{
		return this.slimCache.get(id);
	}

	constructor(private http: HttpClient)
	{}

	public createSememe() : Sememe
	{
		// Create the new sememe
		let sememe: Sememe = {
			id: this.nextSememeID--,
			createdAt: null,
			updatedAt: null,
			version: null,
			creatorID: null, // will be set by the backend no matter what
			internalName: null,
			variantIDs: null,
			levelIDs: null,
			categoryIDs: null,
			dialectIDs: null,
			fillSpec: 1,
			specTemplate: null,
			spec: null,
			properties: null,
			lexemeID: null, // TODO this could be set to the ID of the active lexeme (when it's a top lexeme)
			active: true,
			synGroupID: null,
			synGroup: null,
			apiAction: ApiAction.Insert,
			changed: false
		};
		this.cache.add(sememe.id, sememe);
		return sememe;
	}

	public loadTransient(filter: string, langID: number, textSearchType: TextSearchType = 'Prefixed')
		: Observable<Response<SSearchResult>>
	{
		const href = `${environment.apiUrl}/admin/${sememesApiPath}/`;
		const requestUrl = `${href}`;

		let searchRequest: SSearchRequest = {
			filter: filter,
			langID: langID,
			textSearchType: textSearchType,
		};

		return this.http.patch<Response<SSearchResult>>(requestUrl, searchRequest);
	}

	/*
	public loadByID(id: number): Observable<Sememe>
	{
		let result = null;
		if (id < 0) {
			result = new Observable<Sememe>(observer => {
				let sememe = this.cache.get(id);
				observer.next(sememe);
			});
		} else if (id > 0) {
			const href = `${environment.apiUrl}/admin/${sememesApiPath}`;
			// TODO Is there any error handling and checking of the loaded entity that I should do?
			result = this.http.get<Response<Sememe>>(`${href}/${id}`)
				.pipe(
					map(response => {
						return response.data;
					})
				);
		} else {
			result = new Observable<Sememe>(observer => {
				observer.next(null);
			});
		}
		return result.pipe(first());
	}
	*/

	public loadSlimByID(id: number): Observable<SememeSlim>
	{
		let result = null;
		if (id < 0 || !!this.slimCache.get(id)) {
			result = new Observable<SememeSlim>(observer => {
				let sememe = this.slimCache.get(id);
				observer.next(sememe);
			});
		} else if (id > 0) {
			const href = `${environment.apiUrl}/admin/${sememesApiPath}/slim`;
			// TODO Is there any error handling and checking of the loaded entity that I should do?
			result = this.http.get<Response<SememeSlim>>(`${href}/${id}`)
				.pipe(
					map(response => {
						let slim: SememeSlim = response.data;
						this.addSlimToCache(slim);
						return slim;
					})
				);
		} else {
			result = new Observable<SememeSlim>(observer => {
				observer.next(null);
			});
		}
		return result.pipe(first());
	}
}