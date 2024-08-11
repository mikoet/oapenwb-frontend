// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco'
import { UiLanguage } from '../_models/admin-api';
import { uiLanguageApiPath } from '../_models/admin-api-paths';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { DisableControlDirective } from '../_directives/disable-control.directive';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-ui-language',
    templateUrl: './ui-language.component.html',
    styleUrls: ['./ui-language.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, DisableControlDirective, MatHint, MatCheckbox, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class UiLanguageComponent extends AbstractSEC<UiLanguage>
{
	// table attributes
	displayedColumns: string[] = ['locale', 'localName', 'isDefault', 'active', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService)
	{
		super(httpClient, transloco, 'locale', uiLanguageApiPath, { isDefault: false, active: false });
	}

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			locale: new FormControl('', { validators: Validators.required, nonNullable: true }),
			version: new FormControl<number|null>(null),
			localName: new FormControl('', { validators: Validators.required, nonNullable: true }),
			isDefault: new FormControl(false, { validators: Validators.required, nonNullable: true }),
			active: new FormControl(false, { validators: Validators.required, nonNullable: true }),
		});
	}

	dataLoadedHook(data: UiLanguage[])
	{
		// niks to doon
	}
}