// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService } from '@ngneat/transloco'
import { UiTranslationScope } from '../_models/admin-api';
import { uiScopeApiPath } from '../_models/admin-api-paths';

@Component({
  selector: 'app-ui-scope',
  templateUrl: './ui-scope.component.html',
  styleUrls: ['./ui-scope.component.scss']
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