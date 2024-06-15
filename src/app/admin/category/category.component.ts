// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslocoService } from '@ngneat/transloco';

import { Category } from '../_models/admin-api';
import { categoriesApiPath } from '../_models/admin-api-paths';
import { DataService } from '../_services/data.service';
import { AbstractSECPlus } from '../abstract/abstract-simple-entity-plus';

@Component({
	selector: 'app-category',
	templateUrl: './category.component.html',
	styleUrls: ['./category.component.scss']
  })
  export class CategoryComponent extends AbstractSECPlus<Category>
{
	// table attributes
	displayedColumns: string[] = ['uitID', 'uitID_abbr', 'parentID', 'description', 'actions'];

	constructor(
		data: DataService,
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(data, httpClient, transloco, 'id', categoriesApiPath, {});
	}

	ngOnInit(): void {
		super.ngOnInit();
	}

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			uitID_abbr: new FormControl<string|null>(null, Validators.required),
			uitID: new FormControl<string|null>(null, Validators.required),
			parentID: new FormControl<number|null>(null),
			description: new FormControl<string|null>(null),
		});
	}

	dataLoadedHook(data: Category[])
	{
		// niks to doon
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

	getParentsForActiveEntity(): Category[]
	{
		if (this.entityForm.value.id === null || this.entityForm.value.id === undefined) {
			return this.dataSource.data;
		}
		let result: Category[] = [];
		for (let parentCat of this.dataSource.data) {
			if (parentCat.id !== this.entityForm.value.id) {
				result.push(parentCat);
			}
		}
		return result;
	}

	getParentNameForTable(id: number): string
	{
		let name: string = "id: " + id;
		for (let category of this.dataSource.data) {
			if (category.id === id) {
				name = this.transloco.translate(category.uitID);
				break;
			}
		}
		return name;
	}
}