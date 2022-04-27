// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterViewInit, Component, forwardRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NumericKeyMap } from '@app/util/hashmap';
import { DataService, ExtCategory } from '@app/admin/_services/data.service';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';

export type ItemType = "Category";

export class Item
{
	id: number;
	uitID_full: string;
	uitID_abbr: string;
	level: number;
}

/**
 * Premisses:
 * - This component is to be used for hierarchically ordered items
 * - These items do have a full and an abbreviated caption text that is each stored via an uitID
 */
@Component({
	selector: 'admin-hierarchical-select',
	templateUrl: './hierarchical-select.component.html',
	styleUrls: ['./hierarchical-select.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => HierarchicalSelectComponent),
			multi: true
		}
	]
})
export class HierarchicalSelectComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor
{
	private dataLoad: Subscription;
	private selectionChanges: Subscription;

	itemType: ItemType = 'Category';
	items: Item[]; // only contains the top items of the hierarchy
	allItems: NumericKeyMap<Item> = new NumericKeyMap();
	hasItems() : boolean
	{
		return !!this.items && this.items.length > 0;
	}

	@ViewChild('itemSelect')
	itemSelect: MatSelect;

	private buildItems() : void
	{
		let items: Item[] = [];
		let allItems: NumericKeyMap<Item> = new NumericKeyMap();

		let topCategories: ExtCategory[] = this.data.store.categories.values;
		//if (!!topCategories && topCategories?.length > 0) {
			this.collectCategories(topCategories, items, allItems, 0);
		//}

		this.items = items;
		this.allItems = allItems;
	}

	private reset() : void
	{
		this.items = [];
		this.allItems = new NumericKeyMap();
	}

	/**
	 * Recursively collects the categories starting with those given in the array categories
	 * with processing the children of each.
	 * 
	 * @param categories 
	 * @param resultingCategories 
	 * @param level 
	 */
	private collectCategories(categories: ExtCategory[], resultingCategories: Item[], allCategories: NumericKeyMap<Item>, level: number): void
	{
		if (!!categories && categories?.length > 0) {
			for (let category of categories) {
				let item: Item = {
					id: category.id,
					uitID_full: category.uitID,
					uitID_abbr: category.uitID_abbr,
					level: level
				}

				resultingCategories.push(item);
				allCategories.add(item.id, item);

				this.collectCategories(category._children, resultingCategories, allCategories, level+1);
			}
		}
	}

	constructor(public readonly data: DataService) {}

	ngOnInit(): void
	{
		this.buildItems();
	}

	ngAfterViewInit()
	{
		this.dataLoad = this.data.loading.subscribe(isLoading => {
			this.buildItems();
		});

		this.selectionChanges = this.itemSelect.optionSelectionChanges.subscribe(res => {
			if (!!res.isUserInput) {
				let changedID: number = res.source.value;
				let selectedIDs: number[] = this.itemsControl.value as number[];
				if (!!selectedIDs) {
					let selected = selectedIDs?.includes(changedID);
					if (selected) {
						let category = this.data.store.allCategories.get(changedID);
						if (!!category) {
							// Remove all IDs of parents and children including parents of parents and children of children
							selectedIDs = this.deselectParents(category, selectedIDs);
							selectedIDs = this.deselectChildren(category, selectedIDs);

							this.itemsControl.setValue(selectedIDs);
						}
					}
				}
			}
		});
    }

	ngOnDestroy(): void
	{
		this.dataLoad.unsubscribe();
		this.selectionChanges.unsubscribe();
	}

	/**
	 * Will deselect all parents of the given category within this component.
	 * 
	 * @param category category for which the parents shall be unselected
	 * @param selectedValues 
	 * @returns 
	 */
	private deselectParents(category: ExtCategory, selectedValues: number[]) : number[]
	{
		if (!category.parentID) {
			return selectedValues;
		}

		do {
			category = this.data.store.allCategories.get(category.parentID);
			let index = selectedValues.indexOf(category.id);
			if (index != -1) {
				selectedValues.splice(index, 1);
			}
		} while (!!category.parentID);

		return selectedValues;
	}

	/**
	 * Will deselect all children elements recursively of the given category within this component.
	 * 
	 * @param category category for which the children shall be unselected
	 * @param selectedValues 
	 * @returns 
	 */
	private deselectChildren(category: ExtCategory, selectedValues: number[]) : number[]
	{
		if (!category._children || category._children.length === 0) {
			return selectedValues;
		}

		for (let child of category._children) {
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

	itemsControl: FormControl = new FormControl();

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