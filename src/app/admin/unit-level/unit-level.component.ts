// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';

import { Level } from '../_models/admin-api';
import { unitLevelsApiPath } from '../_models/admin-api-paths';
import { DataService } from '../_services/data.service';
import { AbstractSECPlus } from '../abstract/abstract-simple-entity-plus';
import { UIT_ID_REGEX } from '../_util/uit-id';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-unit-level',
    templateUrl: './unit-level.component.html',
    styleUrls: ['./unit-level.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatHint, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
  export class UnitLevelComponent extends AbstractSECPlus<Level>
{
	// table attributes
	displayedColumns: string[] = ['uitID', 'uitID_abbr', 'description', 'actions'];

	constructor(
		data: DataService,
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(data, httpClient, transloco, 'id', unitLevelsApiPath, {});
	}

	ngOnInit(): void {
		super.ngOnInit();
	}

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			uitID_abbr: new FormControl<string|null>(null, [Validators.required, Validators.pattern(UIT_ID_REGEX)]),
			uitID: new FormControl<string|null>(null, [Validators.required, Validators.pattern(UIT_ID_REGEX)]),
			description: new FormControl<string|null>(null),
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