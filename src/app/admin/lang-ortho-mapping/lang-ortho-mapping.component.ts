// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { TranslocoService } from '@ngneat/transloco';

import { AbstractSEC } from '../abstract/abstract-simple-entity';
import { LangOrthoMapping, Language, Orthography } from '../_models/admin-api';
import { langApiPath, loMappingApiPath, orthoApiPath } from '../_models/admin-api-paths';

@Component({
	selector: 'app-lang-ortho-mapping',
	templateUrl: './lang-ortho-mapping.component.html',
	styleUrls: ['./lang-ortho-mapping.component.scss']
  })
  export class LangOrthoMappingComponent extends AbstractSEC<LangOrthoMapping>
  {
	langs: Language[] = [];
	orthographies: Orthography[] = [];

	// table attributes
	displayedColumns: string[] = ['langID', 'orthographyID', 'position', 'actions'];

	constructor(
		private formBuilder: FormBuilder,
		httpClient: HttpClient,
		transloco: TranslocoService)
	{
		super(httpClient, transloco, 'id', loMappingApiPath, {});
	}

	getLangsForActiveEntity(): Language[]
	{
		return this.langs;
	}

	getOrthographiesForActiveEntity(): Orthography[]
	{
		return this.orthographies;
	}

	getLangLocaleForID(id: number): string
	{
		let name: string = "id: " + id;
		for (let lang of this.langs) {
			if (lang.id === id) {
				name = lang.locale;
				break;
			}
		}
		return name;
	}

	getOrthographyPresentationForID(id: number): string
	{
		let name: string = "id: " + id;
		for (let ortho of this.orthographies) {
			if (ortho.id === id) {
				name = ortho.description;
				break;
			}
		}
		return name;
	}

	buildForm(): void
	{
		this.entityForm = this.formBuilder.group({
			id: [null],
			version: [null],
			langID: [null, Validators.required],
			orthographyID: [null, Validators.required],
			position: [0, Validators.required]
		});

		// Load the Languages for the select-box
		this.executeTypedGetAll<Language>(langApiPath)
			.pipe(
				retry(3),
				map((result: Response<Language[]>) => {
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Loading languages failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleError(error);
				}),
			).subscribe((data: Language[]) => {
				this.langs = data;
			});

		// Load the Orthographies for the select-box
		this.executeTypedGetAll<Orthography>(orthoApiPath)
			.pipe(
				retry(3),
				map((result: Response<Orthography[]>) => {
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Loading orthographies failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleError(error);
				}),
			).subscribe((data: Orthography[]) => {
				this.orthographies = data;
			});
	}

	dataLoadedHook(data: LangOrthoMapping[])
	{
		// niks to doon
	}
}