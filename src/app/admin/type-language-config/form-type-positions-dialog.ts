// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList, CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { FormTypePos, LexemeFormType } from '../_models/admin-api';
import { DataService, Entities } from '../_services/data.service';
import { Subscription } from 'rxjs';
import { KeyMap } from '@app/util/hashmap';
import { TranslocoService, TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { DEFAULT_UI_LOCALE } from '@app/_config/config';
import { MatButton } from '@angular/material/button';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';

export class DialogData
{
	lexemeTypeID: number;
	langID: number;
	currentFormTypes: FormTypePos[]
}

@Component({
    selector: 'form-type-positions-dialog',
    templateUrl: './form-type-positions-dialog.html',
    styleUrls: ['./form-type-positions-dialog.scss'],
    providers: [
        { provide: TRANSLOCO_SCOPE, useValue: 'dftpa', multi: true },
        { provide: TRANSLOCO_SCOPE, useValue: 'formType', multi: true }
    ],
    standalone: true,
    imports: [TranslocoDirective, MatDialogTitle, CdkScrollable, MatDialogContent, CdkDropList, NgFor, CdkDrag, NgClass, CdkDragPlaceholder, NgIf, MatButton, MatDialogActions, MatDialogClose]
})
export class FormTypePositionsDialog implements OnInit, OnDestroy
{
	@ViewChild('placedList', {static: false}) placedListRef: ElementRef;
	@ViewChild('availabeList', {static: false}) availabeListRef: ElementRef;

	private lftSubscription: Subscription;

	lexemeTypeID: number = null;
	placed: FormTypePos[] = [];
	available: LexemeFormType[] = [];

	// Translation: admin.lexemeFormType
	private uitSubLFT: Subscription;
	private uit_admin_lexemeFormType: string;
	// Translations: whole scope 'formType'

	constructor(
		public dialogRef: MatDialogRef<FormTypePositionsDialog>,
		@Inject(MAT_DIALOG_DATA) config: DialogData,
		private transloco: TranslocoService,
		private data: DataService)
	{
		this.lexemeTypeID = config.lexemeTypeID;
		this.placed = Object.assign([], config.currentFormTypes);
		this.data.reinitialiseSpecified(new KeyMap<void>().add(Entities.LexemeFormTypes));
	}

	ngOnInit(): void
	{
		this.uitSubLFT = this.transloco.selectTranslate('lexemeFormType', null, 'admin')
		.subscribe(result => {
			this.uit_admin_lexemeFormType = result;
		});

		this.lftSubscription = this.data.lexemeFormTypes.subscribe(result => {
			if (this.placed && this.placed.length > 0) {
				let available: LexemeFormType[] = Object.assign([], result.get(this.lexemeTypeID)?.values);
				// Splice out the elements in available that are already placed
				for (let i = 0; i < available.length; i++) {
					for (let placedItem of this.placed) {
						if (available[i]?.id === placedItem?.formTypeID) {
							available.splice(i, 1);
							break;
						}
					}
				}
				this.available = available;
			} else {
				// Just take them all
				this.available = Object.assign([], result.get(this.lexemeTypeID)?.values);
			}
		});
	}

	ngOnDestroy(): void
	{
		this.uitSubLFT.unsubscribe();
		this.lftSubscription.unsubscribe();
	}

	drop(event: CdkDragDrop<string[]>)
	{
		if (event.previousContainer === event.container) {
			moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
		} else {
			let moveFromAvailableToPlaced: boolean = false;
			if (this.availabeListRef['id'] === event.previousContainer.id) {
				moveFromAvailableToPlaced = true;
			}
			this.transferArrayItem(moveFromAvailableToPlaced, event.previousIndex, event.currentIndex);
		}
		this.renumberPlaced();
	}

	addAll() : void
	{
		while (this.available.length > 0) {
			this.transferArrayItem(true, 0, this.placed.length);
		}
	}

	addEmpty() : void
	{
		this.available.push(null);
	}

	reset() : void
	{
		this.available = Object.assign([], this.data.store.lexemeFormTypes.get(this.lexemeTypeID)?.values);
		this.placed = [];
		this.transloco.setActiveLang(DEFAULT_UI_LOCALE);
	}

	getFormTypeText(formTypeID: number) : string
	{
		let formType = this.data.store.lexemeFormTypes?.get(this.lexemeTypeID)?.get(formTypeID);
		let uitID = formType?.uitID;
		if (uitID) {
			return this.transloco.translate('formType.' + uitID);
		}
		if (formType) {
			return formType.name;
		}
		return this.uit_admin_lexemeFormType + ' ' + formTypeID;
	}

	private transferArrayItem<T = any>(moveFromAvailableToPlaced: boolean, currentIndex: number,
		targetIndex: number): void
	{
		if (moveFromAvailableToPlaced) {
			let available: LexemeFormType = this.available[currentIndex];
			let placed: FormTypePos = null;
			if (available) {
				placed = { formTypeID: available.id, position: -1 };
			}
			this.available.splice(currentIndex, 1);
			this.placed.splice(targetIndex, 0, placed);
		} else {
			let placed: FormTypePos = this.placed[currentIndex];
			let available: LexemeFormType = null;
			if (placed) {
				available = this.data.store.lexemeFormTypes?.get(this.lexemeTypeID)?.get(placed.formTypeID);
			}
			this.placed.splice(currentIndex, 1);
			this.available.splice(targetIndex, 0, available);
		}
	}

	private renumberPlaced() : void
	{
		for (let i = 1; i <= this.placed.length; i++) {
			let item = this.placed[i-1];
			if (item) {
				item.position = i;
			}
		}
	}
}