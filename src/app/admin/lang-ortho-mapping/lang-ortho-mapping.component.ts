// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';

import { AbstractSEC } from '../abstract/abstract-simple-entity';
import { LangOrthoMapping, Language, Orthography } from '../_models/admin-api';
import { langApiPath, loMappingApiPath, orthoApiPath } from '../_models/admin-api-paths';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-lang-ortho-mapping',
    templateUrl: './lang-ortho-mapping.component.html',
    styleUrls: ['./lang-ortho-mapping.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatOption, MatInput, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
  export class LangOrthoMappingComponent extends AbstractSEC<LangOrthoMapping>
  {
	langs: Language[] = [];
	orthographies: Orthography[] = [];

	// table attributes
	displayedColumns: string[] = ['langID', 'orthographyID', 'position', 'actions'];

	constructor(
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
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			langID: new FormControl<number|null>(null, Validators.required),
			orthographyID: new FormControl<number|null>(null, Validators.required),
			position: new FormControl(0, { nonNullable: true }),
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