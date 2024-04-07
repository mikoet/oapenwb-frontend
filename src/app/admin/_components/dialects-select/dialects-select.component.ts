// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterViewInit, Component, forwardRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NumericKeyMap } from '@app/util/hashmap';
import { DataService, ExtLanguage } from '@app/admin/_services/data.service';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { Item } from '../hierarchical-select/hierarchical-select.component';

/**
 * Premisses:
 * - This component is to be used for hierarchically ordered items
 * - These items do have a full and an abbreviated caption text that is each stored via an uitID
 */
@Component({
	selector: 'admin-dialects-select',
	templateUrl: './dialects-select.component.html',
	styleUrls: ['./dialects-select.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => DialectsSelectComponent),
			multi: true
		}
	]
})
export class DialectsSelectComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor
{
	private selectionChanges: Subscription;

	items: Item[]; // only contains the top items of the hierarchy
	allItems: NumericKeyMap<Item> = new NumericKeyMap();
	hasItems() : boolean
	{
		return !!this.items && this.items.length > 0;
	}

	@ViewChild('dialectSelect')
	dialectSelect: MatSelect;

	private _langID: number = null;
	@Input()
	set langID(langID: number)
	{
		if (!!langID) {
			// Only if the langID changes rebuild the items
			if (langID != this._langID) {
				this._langID = langID;
				this.buildItems();
			}
		} else {
			// No language -> reset items
			this._langID = langID;
			this.reset();
		}
	}
	get langID() : number {
		return this._langID;
	}

	private buildItems() : void
	{
		let items: Item[] = [];
		let allItems: NumericKeyMap<Item> = new NumericKeyMap();

		let startLang : ExtLanguage = this.data.store.allLanguages.get(this._langID);
		if (!!startLang) {
			this.collectDialects(startLang, items, allItems, 0);
		}

		this.items = items;
		this.allItems = allItems;
	}

	private reset() : void
	{
		this.items = [];
		this.allItems = new NumericKeyMap();
	}

	/**
	 * Recursively collects the dialects of the starting language 'language'.
	 * 
	 * @param language 
	 * @param resultingDialects 
	 * @param level 
	 */
	private collectDialects(language: ExtLanguage, resultingDialects: Item[], allDialects: NumericKeyMap<Item>, level: number): void
	{
		if (!!language && !!language._children) {
			for (let child of language._children) {
				let dialect: Item = {
					id: child.id,
					uitID_full: child.uitID,
					uitID_abbr: child.uitID_abbr,
					level: level,
					/*parent: child.parentID,
					children: []*/
				}

				resultingDialects.push(dialect);
				allDialects.add(dialect.id, dialect);

				this.collectDialects(child, resultingDialects, allDialects, level+1);
			}
		}
	}

	constructor(public readonly data: DataService) {}

	ngOnInit(): void
	{
	}

	ngAfterViewInit()
	{
		/**
		 * hyr kun ik ansetten:
		 * - in res kryge ik öäver res.source.value ruut keyn ID wesselt warden is
		 * - un in this.itemsControl.value hev ik en array med de aktuel selekteerden IDs <-- de aktioon uut dat vöärige event is dår al binnen!
		 */
		this.selectionChanges = this.dialectSelect.optionSelectionChanges.subscribe(res => {
			if (!!res.isUserInput) {
				let changedID: number = res.source.value;
				let selectedIDs: number[] = this.itemsControl.value as number[];
				if (!!selectedIDs) {
					let selected = selectedIDs?.includes(changedID);
					if (selected) {
						let lang = this.data.store.allLanguages.get(changedID);
						if (!!lang) {
							// Remove all IDs of parents and children including parents of parents and children of children
							selectedIDs = this.deselectParents(lang, selectedIDs);
							selectedIDs = this.deselectChildren(lang, selectedIDs);

							this.itemsControl.setValue(selectedIDs);
						}
					}
				}
			}
		});
    }

	ngOnDestroy(): void
	{
		this.selectionChanges.unsubscribe();
	}

	/**
	 * Will deselect all parents of the given language within this component.
	 * 
	 * @param lang 
	 * @param selectedValues 
	 * @returns 
	 */
	private deselectParents(lang: ExtLanguage, selectedValues: number[]) : number[]
	{
		if (!lang.parentID) {
			return selectedValues;
		}

		do {
			lang = this.data.store.allLanguages.get(lang.parentID);
			let index = selectedValues.indexOf(lang.id);
			if (index != -1) {
				selectedValues.splice(index, 1);
			}
		} while (!!lang.parentID);

		return selectedValues;
	}

	/**
	 * Will deselect all children elements recursively of the given language within this component.
	 * 
	 * @param lang language for which the children shall be unselected
	 * @param selectedValues 
	 * @returns 
	 */
	private deselectChildren(lang: ExtLanguage, selectedValues: number[]) : number[]
	{
		if (!lang._children || lang._children.length === 0) {
			return selectedValues;
		}

		for (let child of lang._children) {
			let index = selectedValues.indexOf(child.id);
			if (index != -1) {
				selectedValues.splice(index, 1);
			}
			selectedValues = this.deselectChildren(child, selectedValues);
		}

		return selectedValues;
	}

	uitID_abbr(id: number)
	{
		return this.allItems.get(id)?.uitID_abbr;
	}

	selectionChanged($event: MatSelectChange)
	{
		if (!!$event.value) {
			// Set the sememe
			//let id = $event.value;
		} else {
			//this.sememe = null;
		}

		// do it
		//this.onChange(this.sememe);
	}

	//

	itemsControl: UntypedFormControl = new UntypedFormControl();

	// Code for interface ControlValueAccessor

	onChange: any = () => {}
	onTouch: any = () => {}

	writeValue(input: number[]): void {
		if (!!input && input?.length !== 0) {
			this.itemsControl.setValue(input , { emitEvent: false });
		} else {
			this.itemsControl.reset();
		}
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		if (isDisabled) {
			this.itemsControl.disable();
		} else {
			this.itemsControl.enable();
		}
	}
}