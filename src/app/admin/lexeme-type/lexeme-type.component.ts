// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService } from '@ngneat/transloco'
import { Language, LexemeType, UiResultCategory } from '../_models/oapenwb-api';
import { langApiPath, lexemeTypeApiPath, uiResultCategoryApiPath } from '../_models/api-pathes';

/**
 * LexemeTypeComponent is the component to administrate the LexemeTypes. It extends AbstractSEC,
 * but overrides the filter behaviour of it:
 * A magicFilterString (see class member in this class) will be put into this.dataSource.filter
 * (dataSource in AbstractSEC) to handle filtering over the selected language.
 * The member this.filterValue will still just contain the filter value that is typed in the UI.
 */
@Component({
	selector: 'app-lexeme-type',
	templateUrl: './lexeme-type.component.html',
	styleUrls: ['./lexeme-type.component.scss']
  })
  export class LexemeTypeComponent extends AbstractSEC<LexemeType>
{
	private static readonly magicFilterString: string = '><//|-<>';

	languages: Language[] = [];
	uiCategories: UiResultCategory[] = [];

	selectedLanguage: number = 0;

	// table attributes
	displayedColumns: string[] = ['name', 'uitID', 'uiCategoryID', 'actions'];

	constructor(private formBuilder: FormBuilder, httpClient: HttpClient, transloco: TranslocoService)
	{
		super(httpClient, transloco, 'id', lexemeTypeApiPath, {});
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
		this.dataSource.filter = LexemeTypeComponent.magicFilterString + filterValue.trim().toLowerCase();
	}

	resetFilter()
	{
		this.filterValue = '';
		this.dataSource.filter = LexemeTypeComponent.magicFilterString + this.filterValue;
	}

	onLanguageChanged(arg: any)
	{
		// Add the language ID (to always have some change in the filter when changing the language) and the magic filter-string
		// as a seperator
		this.dataSource.filter = this.selectedLanguage + LexemeTypeComponent.magicFilterString + this.filterValue;
	}

	getLangLocaleForID(id: number): string
	{
		let name: string = "id: " + id;
		for (let lang of this.languages) {
			if (lang.id === id) {
				name = lang.locale;
				break;
			}
		}
		return name;
	}

	getUiCategoryNameForID(id: number): string
	{
		let name: string = "id: " + id;
		for (let uiCategory of this.uiCategories) {
			if (uiCategory.id === id) {
				name = uiCategory.name;
				break;
			}
		}
		return name;
	}

	buildForm(): void
	{
		// set a custom filter that is able to filter also for the selected language
		this.dataSource.filterPredicate = (set: LexemeType, filter: string) => {
			if (set !== null && set !== undefined) {
				
				let magicIndex = filter.indexOf(LexemeTypeComponent.magicFilterString);
				if (magicIndex !== -1) {
					// Remove the magicString itself and everything before it
					filter = filter.substring(magicIndex + LexemeTypeComponent.magicFilterString.length);
				}
				filter = filter.trim();

				let nameFits: boolean = false;

				if (filter.length > 0) {
					if (!(set.name === null || set.name === undefined)
						&& set.name.toLowerCase().indexOf(filter) !== -1) {
						nameFits = true;
					}
				} else {
					nameFits = true;
				}

				return nameFits;
			}
			return false;
		};

		this.entityForm = this.formBuilder.group({
			id: [null],
			version: [null],
			uitID: ['', Validators.required],
			name: ['', Validators.required],
			uiCategoryID: [null]
		});

		// Load the Languages for the select-box
		this.executeTypedGetAll<Language>(langApiPath)
		.pipe(
			retry(3),
			map((result: Response<Language[]>) => {
				if (result.status === 'success') {
					return result.data;
				} else {
					this.handleMessage(result.message);
					throw new Error('Loading languages failed.');
				}
			}),
			catchError((error: HttpErrorResponse) => {
				return this.handleError(error);
			}),
		).subscribe((data: Language[]) => {
			this.languages = data;
		});

		// Load the UiResultCategories for the select-box
		this.executeTypedGetAll<UiResultCategory>(uiResultCategoryApiPath)
		.pipe(
			retry(3),
			map((result: Response<UiResultCategory[]>) => {
				if (result.status === 'success') {
					return result.data;
				} else {
					this.handleMessage(result.message);
					throw new Error('Loading languages failed.');
				}
			}),
			catchError((error: HttpErrorResponse) => {
				return this.handleError(error);
			}),
		).subscribe((data: UiResultCategory[]) => {
			this.uiCategories = data;
		});
	}

	dataLoadedHook(data: LexemeType[])
	{
		// niks to doon
	}
}