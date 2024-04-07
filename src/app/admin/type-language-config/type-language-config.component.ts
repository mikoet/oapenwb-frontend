// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { TranslocoService } from '@ngneat/transloco';

import { TypeLanguageConfig } from '../_models/admin-api';
import { typeLangConfigsApiPath } from '../_models/admin-api-paths';
import { DataService, Entities } from '../_services/data.service';
import { KeyMap } from '@app/util/hashmap';
import { AbstractSECPlus } from '../abstract/abstract-simple-entity-plus';
import { MatDialog } from '@angular/material/dialog';
import { FormTypePositionsDialog } from './form-type-positions-dialog';

@Component({
	selector: 'app-type-language-config',
	templateUrl: './type-language-config.component.html',
	styleUrls: ['./type-language-config.component.scss']
  })
  export class TypeLanguageConfigComponent extends AbstractSECPlus<TypeLanguageConfig>
{
	// table attributes
	displayedColumns: string[] = ['lexemeTypeID', 'langID', 'actions'];

	constructor(private formBuilder: UntypedFormBuilder, data: DataService, httpClient: HttpClient, transloco: TranslocoService,
		private dialog: MatDialog)
	{
		super(data, httpClient, transloco, 'id', typeLangConfigsApiPath, {});
	}

	ngOnInit() : void {
		super.ngOnInit();
		// Reload data that is needed here
		this.data.reinitialiseSpecified(new KeyMap<void>().add(Entities.Orthographies).add(Entities.Languages)
			.add(Entities.LexemeTypes));
	}

	getCurrentLexemeTypeID() : number {
		return this.entityForm.get('lexemeTypeID')?.value;
	}

	getCurrentLangID() : number {
		return this.entityForm.get('lexemeTypeID')?.value;
	}

	canEditFtPositions() : boolean {
		if (this.getCurrentLexemeTypeID()) {
			return true;
		}
		return false;
	}

	openFtPositionsDialog() : void {
		const dialogRef = this.dialog.open(FormTypePositionsDialog, {
			data: {
				lexemeTypeID: this.entityForm.get('lexemeTypeID')?.value,
				langID: this.entityForm.get('langID')?.value,
				currentFormTypes: this.entityForm.get('formTypePositions').value,
			}
		});
		dialogRef.afterClosed().subscribe(result => {
			this.entityForm.get('formTypePositions').setValue(result);
		});
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

	buildForm(): void
	{
		this.entityForm = this.formBuilder.group({
			id: [null],
			version: [null],
			lexemeTypeID: [null, Validators.required],
			langID: [null, Validators.required],
			formTypePositions: [null],
		});
	}

	dataLoadedHook(data: TypeLanguageConfig[])
	{
		// niks to doon
	}
}