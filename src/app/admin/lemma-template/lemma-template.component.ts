// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslocoService } from '@ngneat/transloco';

import { LemmaTemplate } from '../_models/admin-api';
import { lemmaTemplatesApiPath } from '../_models/admin-api-paths';
import { DataService, Entities } from '../_services/data.service';
import { KeyMap } from '@app/util/hashmap';
import { AbstractSECPlus } from '../abstract/abstract-simple-entity-plus';

@Component({
	selector: 'app-lemma-template',
	templateUrl: './lemma-template.component.html',
	styleUrls: ['./lemma-template.component.scss']
  })
export class LemmaTemplateComponent extends AbstractSECPlus<LemmaTemplate>
{
	// table attributes
	displayedColumns: string[] = ['name', 'lexemeTypeID', 'langID', 'dialectIDs', 'orthographyID', 'actions'];

	constructor(
		data: DataService,
		httpClient: HttpClient,
		transloco: TranslocoService,
	) {
		super(data, httpClient, transloco, 'id', lemmaTemplatesApiPath, {});
	}

	ngOnInit(): void {
		super.ngOnInit();
		// Reload data that is needed here
		this.data.reinitialiseSpecified(new KeyMap<void>().add(Entities.Orthographies).add(Entities.Languages)
			.add(Entities.LexemeTypes));
	}

	// Dialect data
	get dialectsBasedOnLanguage() : number {
		return this.entityForm.get('langID')?.value;
	}

	getLexemeTypeName(id: number): string
	{
		let name = this.data.store.lexemeTypes?.get(id)?.name;
		if (name) {
			return name;
		}
		return '–';
	}

	getLanguageName(id: number): string
	{
		let name = this.data.store.languages?.get(id)?.uitID;
		if (name) {
			return this.transloco.translate(name);
		}
		return '–';
	}

	getDialectsString(ids: number[]): string
	{
		let result = '';
		for (let dialectID of ids) {
			let name = this.data.store.allLanguages?.get(dialectID)?.uitID_abbr;
			if (name) {
				result += this.transloco.translate(name) + ', ';
			} else {
				result += '(–/–), ';
			}
		}
		if (result.endsWith(', ')) {
			result = result.substring(0, result.length - 2);
		}
		return result;
	}

	getOrthographyName(id: number): string
	{
		let name = this.data.store.orthographies?.get(id)?.description;
		if (name) {
			return name;
		}
		return '–';
	}

	buildForm(): void
	{
		this.entityForm = new FormGroup({
			id: new FormControl<number|null>(null),
			version: new FormControl<number|null>(null),
			name: new FormControl<string|null>(null),
			lexemeTypeID: new FormControl<number|null>(null, Validators.required),
			langID: new FormControl<number|null>(null),
			dialectIDs: new FormControl<number[]|null>(null),
			orthographyID: new FormControl<number|null>(null),
			preText: new FormControl<string|null>(null),
			mainText: new FormControl('', Validators.required),
			postText: new FormControl<string|null>(null),
			alsoText: new FormControl<string|null>(null),
		});
	}

	dataLoadedHook(data: LemmaTemplate[])
	{
		// niks to doon
	}
}