// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { TranslocoService } from '@ngneat/transloco';

import { AbstractSEC } from '../abstract/abstract-simple-entity';
import { LangPair, Language } from '../_models/admin-api';
import { langApiPath, langPairApiPath } from '../_models/admin-api-paths';

@Component({
	selector: 'app-lang-pair',
	templateUrl: './lang-pair.component.html',
	styleUrls: ['./lang-pair.component.scss']
  })
  export class LangPairComponent extends AbstractSEC<LangPair> {
	langs: Language[] = [];

	// table attributes
	displayedColumns: string[] = ['id', 'langOneID', 'langTwoID', 'position', 'actions'];

	constructor(private formBuilder: UntypedFormBuilder, httpClient: HttpClient, transloco: TranslocoService)
	{
		super(httpClient, transloco, 'id', langPairApiPath, {});
	}

	getLangsForActiveEntity(): Language[]
	{
		return this.langs;
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

	buildForm(): void
	{
		this.entityForm = this.formBuilder.group({
			id: [null, Validators.required],
			version: [null],
			langOneID: [null, Validators.required],
			langTwoID: [null, Validators.required],
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
	}

	dataLoadedHook(data: LangPair[])
	{
		// niks to doon
	}
}