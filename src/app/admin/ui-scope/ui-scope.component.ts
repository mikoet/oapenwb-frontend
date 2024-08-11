// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco'
import { UiTranslationScope } from '../_models/admin-api';
import { uiScopeApiPath } from '../_models/admin-api-paths';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { DisableControlDirective } from '../_directives/disable-control.directive';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-ui-scope',
    templateUrl: './ui-scope.component.html',
    styleUrls: ['./ui-scope.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatInput, DisableControlDirective, MatHint, MatButton, MatLabel, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatCheckbox, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class UiScopeComponent extends AbstractSEC<UiTranslationScope>
{
	// table attributes
	displayedColumns: string[] = ['id', 'description', 'essential', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(httpClient, transloco, 'id', uiScopeApiPath, { essential: false });
	}

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			id: new FormControl('', { validators: Validators.required, nonNullable: true }),
			version: new FormControl<number|null>(null),
			description: new FormControl('', { validators: Validators.required, nonNullable: true }),
			essential: new FormControl(false, { validators: Validators.required, nonNullable: true }),
		});
	}

	dataLoadedHook(data: UiTranslationScope[])
	{
		// niks to doon
	}
}