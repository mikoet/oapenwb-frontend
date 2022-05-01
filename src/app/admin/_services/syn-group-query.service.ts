// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NumericKeyMap } from '@app/util/hashmap';
import { Response } from '@app/_models/response';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { synGroupsApiPath } from '../_models/admin-api-paths';
import { SGSearchRequest, SGSearchResult, SynGroup, TextSearchType } from '../_models/admin-api';
import { ApiAction } from '../_models/enums';
import { SememeService } from './sememe.service';

@Injectable()
export class SynGroupQueryService
{
	private nextSynGroupID: number = -1;
	/**
	 * This cache is for storing the SynGroups that were just created over this service
	 * and got a negative ID. This makes it possible for this service to return this unpersistent
	 * SynGroups by the method #loadByID(id:number).
	 * The downside is that currently SynGroups are not getting removed after having been
	 * persisted which is a small 'memory leak'.
	 */
	private internalCache: NumericKeyMap<SynGroup> = new NumericKeyMap();

	constructor(private http: HttpClient, private sememeService: SememeService)
	{}

	public loadTransient(filter: string, langID: number, textSearchType: TextSearchType = 'Prefixed')
		: Observable<Response<SGSearchResult>>
	{
		const href = `${environment.apiUrl}/admin/${synGroupsApiPath}/`;
		const requestUrl = `${href}`;

		let searchRequest: SGSearchRequest = {
			filter: filter,
			langID: langID,
			textSearchType: textSearchType,
		};

		return this.http.patch<Response<SGSearchResult>>(requestUrl, searchRequest);
	}

	public loadByID(id: number): Observable<SynGroup>
	{
		let result = null;
		if (id < 0) {
			result = new Observable<SynGroup>(observer => {
				let synGroup = this.internalCache.get(id);
				observer.next(synGroup);
			});
		} else if (id > 0) {
			const href = `${environment.apiUrl}/admin/${synGroupsApiPath}`;
			// TODO Is there any error handling and checking of the loaded entity that I should do?
			result = this.http.get<Response<SynGroup>>(`${href}/${id}`)
				.pipe(
					map(response => {
						this.loadSlimSememes(response.data);
						return response.data;
					})
				);
		} else {
			result = new Observable<SynGroup>(observer => {
				observer.next(null);
			});
		}
		return result.pipe(first());
	}

	public loadSlimSememes(synGroup: SynGroup) : void
	{
		if (!!synGroup && !!synGroup.sememeIDs) {
			synGroup.sememeIDs.forEach(sememeID => {
				this.sememeService.loadSlimByID(sememeID).subscribe(slimDTO => {
					// Was added to cache automatically in SememeService
				});
			});
		}
	}

	public createSynGroup() : SynGroup
	{
		let synGroup: SynGroup = {
			id: this.nextSynGroupID--,
			version: null,
			createdAt: null,
			updatedAt: null,
			creatorID: null,
			sememeIDs: [],
			description: null,
			presentation: null,
			changed: true,
			apiAction: ApiAction.Insert
		};
		this.internalCache.add(synGroup.id, synGroup);
		return synGroup;
	}
}