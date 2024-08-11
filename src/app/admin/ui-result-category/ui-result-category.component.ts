// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco'
import { UiResultCategory } from '../_models/admin-api';
import { uiResultCategoryApiPath } from '../_models/admin-api-paths';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-ui-result-category',
    templateUrl: './ui-result-category.component.html',
    styleUrls: ['./ui-result-category.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatHint, MatLabel, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class UiResultCategoryComponent extends AbstractSEC<UiResultCategory>
{
	// table attributes
	displayedColumns: string[] = ['name', 'uitID', 'position', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService
	) {
		super(httpClient, transloco, 'id', uiResultCategoryApiPath, {});
	}

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			name: new FormControl('', { validators: Validators.required, nonNullable: true }),
			uitID: new FormControl('', { validators: Validators.required, nonNullable: true }),
			position: new FormControl(0, { validators: Validators.required, nonNullable: true }),
		});
	}

	dataLoadedHook(data: UiResultCategory[])
	{
		// niks to doon
	}
}