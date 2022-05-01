// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { FilterOptions, Language, LexemeType, State, Tag, TextSearchType } from '@app/admin/_models/admin-api';
import { DataService } from '@app/admin/_services/data.service';
import { LexemeQueryService } from '@app/admin/_services/lexeme-query.service';
import { Dictionary } from '@app/util/hashmap';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-filter-menu',
	templateUrl: './filter-menu.component.html',
	styleUrls: ['./filter-menu.component.scss']
})
export class FilterMenuComponent implements OnInit, OnDestroy
{
	// Formular
	form: FormGroup;
	get langsFormArray() {
		return this.form.controls.languages as FormArray;
	}
	get typesFormArray() {
		return this.form.controls.types as FormArray;
	}
	get tagsFormArray() {
		return this.form.controls.tags as FormArray;
	}

	// Search type
	searchType: TextSearchType = 'PostgreWeb';
	searchTypeClicked($event: any, value: TextSearchType) : void
	{
		$event.stopPropagation();
		this.lexemeQuery.searchType = value;
	}

	// Languages subscription and languages attribute
	private langsSubscription: Subscription;
	languages: Language[] = []; // the indices of this array are in sync with those of the form array (!)
	langClicked($event: any, index: number) : void
	{
		$event.stopPropagation();
		if (!this.checkboxClicked($event)) {
			// Workaround for the case the user clicks onto the div but not directly the checkbox
			let control = this.langsFormArray.controls[index];
			control.setValue(!control.value); // toggle the checkbox when div was clicked
		}
	}

	// LexemeTypes subscription and types attribute
	private typesSubscription: Subscription;
	types: LexemeType[] = []; // the indices of this array are in sync with those of the form array (!)
	typeClicked($event: any, index: number) : void
	{
		$event.stopPropagation();
		if (!this.checkboxClicked($event)) {
			// Workaround for the case the user clicks onto the div but not directly the checkbox
			let control = this.typesFormArray.controls[index];
			control.setValue(!control.value); // toggle the checkbox when div was clicked
		}
	}

	// Tags subscription and filtered tags attribute (without unused tags)
	private tagsSubscription: Subscription;
	tags: Tag[] = []; // the indices of this array are in sync with those of the form array (!)
	tagClicked($event: any, index: number) : void
	{
		$event.stopPropagation();
		if (!this.checkboxClicked($event)) {
			// Workaround for the case the user clicks onto the div but not directly the checkbox
			let control = this.tagsFormArray.controls[index];
			control.setValue(!control.value); // toggle the checkbox when div was clicked
		}
	}

	// Filtering for flag active
	active: State = 'Both';
	activeClicked($event: any, value: State) : void
	{
		$event.stopPropagation();
		this.active = value;
	}

	constructor(private readonly formBuilder: FormBuilder, private readonly data: DataService,
		public readonly lexemeQuery: LexemeQueryService)
	{
		this.form = this.formBuilder.group({
			languages: new FormArray([]),
			types: new FormArray([]),
			tags: new FormArray([])
		});
	}

	/**
	 * @returns a instance of FilterOptions if any filter is set, or null
	 */
	public getFilterOptions() : FilterOptions
	{
		let langIDs: number[] = [];
		for (let i = 0; i < this.languages.length; i++) {
			if (this.langsFormArray.controls[i].value === true) {
				langIDs.push(this.languages[i].id);
			}
		}

		let typeIDs: number[] = [];
		for (let i = 0; i < this.types.length; i++) {
			if (this.typesFormArray.controls[i].value === true) {
				typeIDs.push(this.types[i].id);
			}
		}

		let tags: string[] = [];
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tagsFormArray.controls[i].value === true) {
				tags.push(this.tags[i].tag);
			}
		}

		let state = this.active;

		let result: FilterOptions = null;
		if (langIDs.length > 0 || typeIDs.length > 0 || tags.length > 0 || state !== 'Both') {
			result = {
				langIDs: langIDs,
				typeIDs: typeIDs,
				tags: tags,
				state: state
			};
		}

		return result;
	}

	ngOnInit(): void
	{
		this.langsSubscription = this.data.languages.subscribe(languageMap => {
			// Clear the form array and newly fill it
			this.langsFormArray.clear();
			languageMap.values.forEach((language) => this.langsFormArray.push(new FormControl(false)));
			this.languages = [...languageMap.values];
		});

		this.typesSubscription = this.data.lexemeTypes.subscribe(types => {
			// Clear the form array and newly fill it
			this.typesFormArray.clear();
			types.forEach((type) => this.typesFormArray.push(new FormControl(false)));
			this.types = [...types];
		});

		this.tagsSubscription = this.data.tags.subscribe(tags => {
			// only take the tags with a usageCount > 0 (there may be guarded once which are unused)
			let tagsArray: Tag[] = [];
			for (let tag of tags) {
				if (tag.usageCount > 0) {
					tagsArray.push(tag);
				}
			}
			let selectedTags: Dictionary<Tag> = {};
			if (this.tags.length > 0) {
				// Collect the previously selected tags
				let formArrayValues = this.tagsFormArray.value;
				for (let i = 0; i < this.tags.length; i++) {
					//let control = this.tagsFormArray.controls[i];
					//if (control.value === true) {
					if (formArrayValues[i] === true) {
						let tagObj = this.tags[i];
						selectedTags[tagObj.tag] = tagObj;
					}
				}
			}
			// Clear the form array and newly fill it
			this.tagsFormArray.clear();
			tagsArray.forEach((tagObj) => this.tagsFormArray.push(new FormControl(selectedTags.hasOwnProperty(tagObj.tag))));
			this.tags = tagsArray;
		});
	}

	ngOnDestroy(): void
	{
		this.langsSubscription.unsubscribe();
		this.typesSubscription.unsubscribe();
		this.tagsSubscription.unsubscribe();
	}

	reset() : void
	{
		this.lexemeQuery.searchType = 'PostgreWeb';
		this.langsFormArray.controls.forEach(control => control.setValue(false));
		this.typesFormArray.controls.forEach(control => control.setValue(false));
		this.tagsFormArray.controls.forEach(control => control.setValue(false));
		this.active = 'Both';
	}

	/**
	 * A click on the Angular Material checkbox itself can be detected if the classname of the source element
	 * is either 'mat-checkbox-inner-container' (= the checkbox itself) or 'mat-checkbox-label' (= the checkbox label).
	 * Both start with 'max-checkbox-' and thus this will be checked here.
	 * Proven to work in Angular Material 12.0.4 as of June 2021.
	 * 
	 * @param $event the DOM mouse click event
	 * @returns true if the click was on the checkbox
	 */
	private checkboxClicked($event: any) : boolean
	{
		return $event?.srcElement?.className?.startsWith('mat-checkbox-');
	}
}