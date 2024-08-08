// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';

import { AbstractSEC } from '../abstract/abstract-simple-entity';
import { LangPair, Language } from '../_models/admin-api';
import { langApiPath, langPairApiPath } from '../_models/admin-api-paths';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { DisableControlDirective } from '../_directives/disable-control.directive';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-lang-pair',
    templateUrl: './lang-pair.component.html',
    styleUrls: ['./lang-pair.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, DisableControlDirective, MatHint, MatSelect, MatOption, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
  export class LangPairComponent extends AbstractSEC<LangPair> {
	langs: Language[] = [];

	// table attributes
	displayedColumns: string[] = ['id', 'langOneID', 'langTwoID', 'position', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
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
		this.entityForm = new FormGroup({
			id: new FormControl('', Validators.required),
			version: new FormControl<number|null>(null),
			langOneID: new FormControl<number|null>(null, Validators.required),
			langTwoID: new FormControl<number|null>(null, Validators.required),
			position: new FormControl(0, { validators: Validators.required, nonNullable: true }),
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