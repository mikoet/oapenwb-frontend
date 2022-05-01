// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService } from '@ngneat/transloco'
import { UiLanguage } from '../_models/admin-api';
import { uiLanguageApiPath } from '../_models/admin-api-paths';

@Component({
	selector: 'app-ui-language',
	templateUrl: './ui-language.component.html',
	styleUrls: ['./ui-language.component.scss']
})
export class UiLanguageComponent extends AbstractSEC<UiLanguage>
{
	// table attributes
	displayedColumns: string[] = ['locale', 'localName', 'isDefault', 'active', 'actions'];

	constructor(
		private formBuilder: FormBuilder,
		httpClient: HttpClient,
		transloco: TranslocoService)
	{
		super(httpClient, transloco, 'locale', uiLanguageApiPath, { isDefault: false, active: false });
	}

	buildForm(): void
	{
		this.entityForm = this.formBuilder.group({
			locale: ['', Validators.required],
			version: [null],
			localName: ['', Validators.required],
			isDefault: [false, Validators.required],
			active: [false, Validators.required]
		});
	}

	dataLoadedHook(data: UiLanguage[])
	{
		// niks to doon
	}
}