// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { TranslocoService } from '@ngneat/transloco';

import { Level } from '../_models/admin-api';
import { unitLevelsApiPath } from '../_models/admin-api-paths';
import { DataService } from '../_services/data.service';
import { AbstractSECPlus } from '../abstract/abstract-simple-entity-plus';
import { UIT_ID_REGEX } from '../_util/uit-id';

@Component({
	selector: 'app-unit-level',
	templateUrl: './unit-level.component.html',
	styleUrls: ['./unit-level.component.scss']
  })
  export class UnitLevelComponent extends AbstractSECPlus<Level>
{
	// table attributes
	displayedColumns: string[] = ['uitID', 'uitID_abbr', 'description', 'actions'];

	constructor(private formBuilder: FormBuilder, data: DataService, httpClient: HttpClient, transloco: TranslocoService)
	{
		super(data, httpClient, transloco, 'id', unitLevelsApiPath, {});
	}

	ngOnInit(): void {
		super.ngOnInit();
	}

	buildForm(): void
	{
		this.entityForm = this.formBuilder.group({
			id: [null],
			version: [null],
			uitID_abbr: [null, Validators.compose([Validators.required, Validators.pattern(UIT_ID_REGEX)])],
			uitID: [null,  Validators.compose([Validators.required, Validators.pattern(UIT_ID_REGEX)])],
			description: [null]
		});
	}

	dataLoadedHook(data: Level[])
	{
		// niks to doon
	}

	// used in the template to shorten descriptions displayed within the table
	getDescForTable(description: string): string {
		if (!!description) {
			if (description.indexOf('\n') != -1) {
				description = description.substring(0, description.indexOf('\n'));
			}
			if (description.length > 32) {
				description = description.substring(0, 31) + '…';
			}
		}
		return description;
	}
}