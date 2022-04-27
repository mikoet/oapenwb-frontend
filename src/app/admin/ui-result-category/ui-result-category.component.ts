// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService } from '@ngneat/transloco'
import { UiResultCategory } from '../_models/oapenwb-api';
import { uiResultCategoryApiPath } from '../_models/api-pathes';

@Component({
	selector: 'app-ui-result-category',
	templateUrl: './ui-result-category.component.html',
	styleUrls: ['./ui-result-category.component.scss']
})
export class UiResultCategoryComponent extends AbstractSEC<UiResultCategory>
{
	// table attributes
	displayedColumns: string[] = ['name', 'uitID', 'position', 'actions'];

	constructor(private formBuilder: FormBuilder, httpClient: HttpClient, transloco: TranslocoService)
	{
		super(httpClient, transloco, 'id', uiResultCategoryApiPath, {});
	}

	buildForm(): void
	{
		this.entityForm = this.formBuilder.group({
			id: [null],
			version: [null],
			name: ['', Validators.required],
			uitID: ['', Validators.required],
			position: [0, Validators.required]
		});
	}

	dataLoadedHook(data: UiResultCategory[])
	{
		// niks to doon
	}
}