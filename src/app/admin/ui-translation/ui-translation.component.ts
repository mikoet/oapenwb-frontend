// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { Response } from '@app/_models/response';
import { environment } from '@environments/environment';

import { AbstractSEC } from '../abstract/abstract-simple-entity';

import { TranslocoService } from '@ngneat/transloco';
import { UiLanguage, UiTranslationScope, UiTranslationSet } from '../_models/admin-api';
import { uiLanguageApiPath, uiScopeApiPath, uiTranslationsApiPath } from '../_models/admin-api-paths';

interface SelectableUiLanguage
{
	locale: string;
	name: string;
}

@Component({
	selector: 'app-ui-translation',
	templateUrl: './ui-translation.component.html',
	styleUrls: ['./ui-translation.component.scss']
  })
export class UiTranslationComponent extends AbstractSEC<UiTranslationSet> {
	private static readonly magicFilterString: string = '><//|-<>';

	// Scope attributes
	uiScopes: UiTranslationScope[];

	//
	uiLanguages: SelectableUiLanguage[] = [];

	// Filter attributes
	selectedScope: string = undefined;
	selectedLanguages: string[];

	// table attributes
	basicColumns: string[] = ['scopeID', 'uitID', 'essential'];
	displayedColumns: string[] = this.basicColumns;

	constructor(
		private formBuilder: FormBuilder,
		httpClient: HttpClient,
		transloco: TranslocoService,
		private snackBar: MatSnackBar)
	{
		super(httpClient, transloco, ['scopeID', 'uitID'], uiTranslationsApiPath, {scopeID: '', essential: false});
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
		this.dataSource.filter = UiTranslationComponent.magicFilterString + filterValue.trim().toLowerCase();
	}

	resetFilter()
	{
		this.filterValue = '';
		this.dataSource.filter = UiTranslationComponent.magicFilterString + this.filterValue;
	}

	onUiScopeChanged(arg: any)
	{
		// Add the language ID (to always have some change in the filter when changing the language) and the magic filter-string
		// as a seperator
		this.dataSource.filter = this.selectedScope + UiTranslationComponent.magicFilterString + this.filterValue;
	}

	onUiLanguagesChanged(arg: any)
	{
		this.applySelectedUiLanguages();
		this.dataSource.filter = this.filterValue;
	}

	private applySelectedUiLanguages()
	{
		let displayedColumns: string[] = Object.assign([], this.basicColumns);
		for (let lang of this.selectedLanguages) {
			displayedColumns.push(lang);
		}
		displayedColumns.push('actions');
		this.displayedColumns = displayedColumns;
	}

	// used in the template to shorten texts
	shortenText(text: string, length: number): string{
		if (text !== null && text !== undefined && text.length >= length) {
			text = text.substring(0, length) + '…';
		}
		return text;
	}

	buildForm(): void
	{
		// set a custom filter that is able to filter for the nested translation property
		// and the optionally selected scopes
		this.dataSource.filterPredicate = (set: UiTranslationSet, filter: string) => {
			if (!!set) {
				if (this.selectedScope === undefined || this.selectedScope == set.scopeID)
				{
					let magicIndex = filter.indexOf(UiTranslationComponent.magicFilterString);
					if (magicIndex !== -1) {
						// Remove the magicString itself and everything before it
						filter = filter.substring(magicIndex + UiTranslationComponent.magicFilterString.length);
					}
					filter = filter.trim();

					/*
					if (!(set.scopeID === null || set.scopeID === undefined)
						&& set.scopeID.toLowerCase().indexOf(filter) !== -1)
					{
						return true;
					}
					*/
					if (!(set.uitID === null || set.uitID === undefined)
						&& set.uitID.toLowerCase().indexOf(filter) !== -1)
					{
						return true;
					}
					if (!(set.translations === null || set.translations === undefined)) {
						// For each possible translation check if it matches the filter
						for (let locale of this.selectedLanguages) {
							let translation = set.translations[locale];
							if (translation !== null && translation !== undefined
								&& translation.toLowerCase().indexOf(filter) !== -1)
							{
								return true;
							}
						}
					}
				}
			}
			return false;
		};

		// Create the entityForm, but it will be recreated a bit later when the UiLanguages
		// are loaded and can only be fully specified then.
		// However, this creation avoids exceptions being thrown.
		this.entityForm = this.formBuilder.group({
			scopeID: [''],
			uitID: ['', [Validators.required, Validators.minLength(2)]],
			essential: [false, Validators.required],
			translations: this.formBuilder.group({}),
		});

		// Load the available UiLanguages
		this.executeTypedGetAll<UiLanguage>(uiLanguageApiPath)
			.pipe(
				retry(3),
				map((result: Response<UiLanguage[]>) => {
					//this.isLoadingResults = false;
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Loading UiLanguages failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					//this.isLoadingResults = false;
					return this.handleError(error);
				}),
			).subscribe((data: UiLanguage[]) => {
				// Collect all UiLanguages for the select elements as well as the form group
				let selectableUiLanguages: SelectableUiLanguage[] = [];
				let translationsGroup = {};
				let selectedLanguages = [];
				let count: number = 0;
				for (let lang of data) {
					selectableUiLanguages.push({
						locale: lang.locale,
						name: lang.localName,
					});
					translationsGroup[lang.locale] = '';
					// Add the first 3 languages as selected languages...
					if (count < 3) {
						selectedLanguages.push(lang.locale);
						count++;
					}
				}
				this.uiLanguages = selectableUiLanguages;
				this.selectedLanguages = selectedLanguages;
				this.applySelectedUiLanguages();

				// !!! Create the entityForm
				this.entityForm = this.formBuilder.group({
					scopeID: [''],
					uitID: ['', [Validators.required, Validators.minLength(2)]],
					essential: [false, Validators.required],
					translations: this.formBuilder.group(translationsGroup),
				});
			});

		// Load the UiScopes for the select-box
		this.executeTypedGetAll<UiTranslationScope>(uiScopeApiPath)
			.pipe(
				retry(3),
				map((result: Response<UiTranslationScope[]>) => {
					//this.isLoadingResults = false;
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Loading UiScopes failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					//this.isLoadingResults = false;
					return this.handleError(error);
				}),
			).subscribe((data: UiTranslationScope[]) => {
				this.uiScopes = data;
			});
	}

	dataLoadedHook(data: UiTranslationSet[])
	{
		// niks to doon
	}

	preEditHook(row: UiTranslationSet): UiTranslationSet
	{
		// For each translation that is missing for a locale, add an empty string to avoid an exception by the editing form
		this.uiLanguages.forEach(uiLanguage => {
			if (row.translations[uiLanguage.locale] === undefined) {
				row.translations[uiLanguage.locale] = '';
			}
		});
		return row;
	}

	onDeliverTranslationsClicked(): void
	{
		const requestUrl = `${environment.apiUrl}/l10n/__reload__`;
		this.httpClient.get<Response<any>>(requestUrl)
			.pipe(
				retry(3),
				map((result: Response<any>) => {
					if (result.status === 'success') {
						return result.status;
					} else {
						throw new Error('Delivering UI translations failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					const failedText: string = this.transloco.translate('admin.deliverUITs:failed');
					const closeText: string = this.transloco.translate('admin.close');
					this.snackBar.open(failedText, closeText, {
						duration: 3500,
						horizontalPosition: 'start',
						verticalPosition: 'bottom',
					});
					return EMPTY;
				}),
			).subscribe((result: string) => {
				const successText: string = this.transloco.translate('admin.deliverUITs:done');
				const failedText: string = this.transloco.translate('admin.deliverUITs:failed');
				const closeText: string = this.transloco.translate('admin.close');
				const text: string = result === 'success' ? successText : failedText;
				this.snackBar.open(text, closeText, {
					duration: 3500,
					horizontalPosition: 'start',
					verticalPosition: 'bottom',
				});
			});
	}
}