// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';

import { AbstractSEC } from '../abstract/abstract-simple-entity';
import { LexemeFormType, LexemeType } from '../_models/admin-api';
import { lexemeFormTypeApiPath, lexemeTypeApiPath } from '../_models/admin-api-paths';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatError, MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf, NgFor } from '@angular/common';

/**
 * LexemeFormTypeComponent is the component to administrate the LexemeFormTypes. It extends AbstractSEC,
 * but overrides the filter behaviour of it:
 * A magicFilterString (see class member in this class) will be put into this.dataSource.filter
 * (dataSource in AbstractSEC) to handle filtering over the selected language.
 * The member this.filterValue will still just contain the filter value that is typed in the UI.
 */
@Component({
    selector: 'app-lexeme-form-type',
    templateUrl: './lexeme-form-type.component.html',
    styleUrls: ['./lexeme-form-type.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MatCard, MatCardContent, MatIconButton, MatIcon, NgFor, MatError, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatOption, MatInput, MatHint, MatCheckbox, MatButton, MatSuffix, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class LexemeFormTypeComponent extends AbstractSEC<LexemeFormType> {
	private static readonly magicFilterString: string = '><//|-<>';

	lexemeTypes: LexemeType[] = [];

	selectedLexemeType = 0;

	// table attributes
	displayedColumns: string[] = ['lexemeTypeID', 'name', 'uitID', 'mandatory', 'position', 'actions'];

	constructor(
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(httpClient, transloco, 'id', lexemeFormTypeApiPath, { mandatory: false });
	}

	/**
	 * !Overridden! from base class so that the magicFilterString can be included into 
	 */
	applyFilter(event: Event)
	{
		let filterValue;
		if (event === null) {
			filterValue = '';
		} else {
			filterValue = (event.target as HTMLInputElement).value;
		}
		this.dataSource.filter = LexemeFormTypeComponent.magicFilterString + filterValue.trim().toLowerCase();
	}

	resetFilter()
	{
		this.filterValue = '';
		this.dataSource.filter = LexemeFormTypeComponent.magicFilterString + this.filterValue;
	}

	onLexemeTypeChanged(arg: any)
	{
		// Add the language ID (to always have some change in the filter when changing the language) and the magic filter-string
		// as a seperator
		this.dataSource.filter = this.selectedLexemeType + LexemeFormTypeComponent.magicFilterString + this.filterValue;
	}

	getLexemeTypeNameForTable(id: number): string
	{
		let name: string = "id: " + id;
		for (let lexemeType of this.lexemeTypes) {
			if (lexemeType.id === id) {
				name = lexemeType.name;
				break;
			}
		}
		return name;
	}

	buildForm(): void
	{
		// set a custom filter that is able to filter also for the selected language
		this.dataSource.filterPredicate = (set: LexemeFormType, filter: string) => {
			if (set !== null && set !== undefined) {
				
				let magicIndex = filter.indexOf(LexemeFormTypeComponent.magicFilterString);
				if (magicIndex !== -1) {
					// Remove the magicString itself and everything before it
					filter = filter.substring(magicIndex + LexemeFormTypeComponent.magicFilterString.length);
				}
				filter = filter.trim();

				let typeFits: boolean = false;
				let filterFits: boolean = false;

				if (this.selectedLexemeType == 0) {
					typeFits = true;
				} else if (!(set.lexemeTypeID === null || set.lexemeTypeID === undefined)
					&& set.lexemeTypeID == this.selectedLexemeType)
				{
					typeFits = true;
				}

				if (filter.length > 0) {
					if (!(set.name === null || set.name === undefined)
						&& set.name.toLowerCase().indexOf(filter) !== -1) {
							filterFits = true;
					} else if (!(set.description === null || set.description === undefined)
						&& set.description.toLowerCase().indexOf(filter) !== -1) {
							filterFits = true;
					}
				} else {
					filterFits = true;
				}

				return filterFits && typeFits;
			}
			return false;
		};

		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			lexemeTypeID: new FormControl<number>(null, { validators: Validators.required, nonNullable: true }),
			name: new FormControl('', { validators: Validators.required, nonNullable: true }),
			uitID: new FormControl('', { validators: Validators.required, nonNullable: true }),
			description: new FormControl<string|null>(null),
			mandatory: new FormControl(false, { validators: Validators.required, nonNullable: true }),
			position: new FormControl(0, { validators: Validators.required, nonNullable: true }),
		});

		// Load the LexemeTypes for the select-box
		// TODO
		this.executeTypedGetAll<LexemeType>(lexemeTypeApiPath)
			.pipe(
				retry(3),
				map((result: Response<LexemeType[]>) => {
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Loading lexeme types failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleError(error);
				}),
			).subscribe((data: LexemeType[]) => {
				this.lexemeTypes = data;
			});
	}

	dataLoadedHook(data: LexemeFormType[])
	{
		// niks to doon
	}
}