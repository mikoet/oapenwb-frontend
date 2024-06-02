// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { TranslocoService } from '@ngneat/transloco';

import { AbstractSEC } from '../abstract/abstract-simple-entity';
import { Language, Orthography } from '../_models/admin-api';
import { langApiPath, orthoApiPath } from '../_models/admin-api-paths';

@Component({
	selector: 'app-language',
	templateUrl: './language.component.html',
	styleUrls: ['./language.component.scss']
  })
export class LanguageComponent extends AbstractSEC<Language> {
	orthographies: Orthography[] = [];

	// table attributes
	displayedColumns: string[] = ['locale', 'localName', 'uitID', 'uitID_abbr', 'parentID', 'mainOrthographyID', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(httpClient, transloco, 'id', langApiPath, {});
	}

	getParentsForActiveEntity(): Language[]
	{
		if (this.entityForm.value.id === null || this.entityForm.value.id === undefined) {
			return this.dataSource.data;
		}
		let result: Language[] = [];
		for (let parentLang of this.dataSource.data) {
			if (parentLang.id !== this.entityForm.value.id) {
				result.push(parentLang);
			}
		}
		return result;
	}

	getParentNameForTable(id: number): string
	{
		let name: string = "id: " + id;
		for (let lang of this.dataSource.data) {
			if (lang.id === id) {
				name = lang.locale;
				break;
			}
		}
		return name;
	}

	getNameForOrthographyID(id: number): string
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
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			parentID: new FormControl<number|null>(null),
			locale: new FormControl('', Validators.required),
			localName: new FormControl('', Validators.required),
			uitID_abbr: new FormControl('', Validators.required),
			uitID: new FormControl('', Validators.required),
			mainOrthographyID: new FormControl<number|null>(null, Validators.required),
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

	dataLoadedHook(data: Language[])
	{
		// niks to doon
	}
}