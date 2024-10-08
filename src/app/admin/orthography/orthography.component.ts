// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Orthography } from '../_models/admin-api';
import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco'
import { orthoApiPath } from '../_models/admin-api-paths';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

interface ParentableOrtho
{
	id: number;
	abbreviation: string;
	uitID?: string;
}

@Component({
    selector: 'app-orthography',
    templateUrl: './orthography.component.html',
    styleUrls: ['./orthography.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatHint, MatLabel, MatSelect, MatOption, MatCheckbox, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class OrthographyComponent extends AbstractSEC<Orthography>
{
	parentableOrthos: ParentableOrtho[] = [];

	// table attributes
	displayedColumns: string[] = ['abbreviation', 'uitID', 'parent', 'publicly', 'description', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(httpClient, transloco, 'id', orthoApiPath, { publicly: true });
	}

	getParentsForActiveEntity(): ParentableOrtho[]
	{
		if (this.entityForm.value.id === null || this.entityForm.value.id === undefined) {
			return this.parentableOrthos;
		}

		let result: ParentableOrtho[] = [];
		for (let parentOrtho of this.parentableOrthos) {
			if (parentOrtho.id !== this.entityForm.value.id) {
				result.push(parentOrtho);
			}
		}
		return result;
	}

	getParentNameForTable(id: number): string
	{
		let name: string = "id: " + id;
		for (let ortho of this.parentableOrthos) {
			if (ortho.id === id) {
				name = ortho.abbreviation;
				break;
			}
		}
		return name;
	}

	// used in the template to shorten descriptions displayed within the table
	getDescForTable(description: string) : string {
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

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			abbreviation: new FormControl('', { validators: Validators.required, nonNullable: true }),
			uitID: new FormControl('', { validators: Validators.required, nonNullable: true }),
			parentID: new FormControl<number|null>(null),
			publicly: new FormControl(false, { validators: Validators.required, nonNullable: true }),
			description: new FormControl<string|null>(null),
		});
	}

	dataLoadedHook(data: Orthography[])
	{
		let parentOrthos: ParentableOrtho[] = [];
		for (let ortho of data) {
			if (ortho.parentID === null || ortho.parentID === 0) {
				// Collect the parentable orthographies
				parentOrthos.push({
					id: ortho.id,
					abbreviation: ortho.abbreviation,
					uitID: ortho.uitID,
				});
			}
		}
		this.parentableOrthos = parentOrthos;
	}
}