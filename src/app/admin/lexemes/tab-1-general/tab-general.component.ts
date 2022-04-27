// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Output, EventEmitter, isDevMode } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { DataService } from '@app/admin/_services/data.service';
import { FormControl } from '@angular/forms';
import { TransferStop } from '../view/view.component';
import { LexemeOrigin, LexemeService } from '@app/admin/_services/lexeme.service';
import { Lexeme } from '@app/admin/_models/oapenwb-api';
import { MatSelectChange } from '@angular/material/select';
import { countErrors, doEnablingControl } from '@app/admin/_util/form-utils';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { LexemeLinkComponent } from '@app/admin/_components/lexeme-link/lexeme-link.component';
import { SHOW_CHANGE_DATA } from '../editor/editor.component';

@Component({
	selector: 'lex-tab-general',
	templateUrl: './tab-general.component.html',
	styleUrls: ['./tab-general.component.scss']
})
export class TabGeneralComponent implements OnInit, OnDestroy
{
	public readonly isDevMode: boolean = isDevMode();
	public readonly showChangeData = SHOW_CHANGE_DATA;

	// Form data
	generalForm: FormGroup;
	@ViewChild(FormGroupDirective) formRef: FormGroupDirective;

	// Error counting
	_errorCount: number = 0;
	get errorCount() : number {
		return this._errorCount;
	}

	// Are changes tracked right now?
	private _trackChanges: boolean = false;
	public get trackChanges() : boolean {
		return this._trackChanges;
	}
	// Was the data in this tab changed since last creating, loading or saving?
	private _changed: boolean = false;
	public get changed() : boolean {
		return this._changed;
	}

	// Subscriptions
	private valueChangesSubscription: Subscription;
	private typeSubscription: Subscription;
	private langSubscription: Subscription;
	private tagsSubscription: Subscription;

	// Event emitters for type and language selection to inform the editor (and other tabs in result)
	@Output()
	typeSelect = new EventEmitter<number>();
	@Output()
	languageSelect = new EventEmitter<number>();

	// Change toggle:
	// Toggle does basically not make sense anymore. One would have to create a new lexeme if they made a mistake.
	//@ViewChild('changeToggle')
	//private changeToggle: MatSlideToggle;
	private changeToggleChecked: boolean = false;
	changeToggleDisabled() : boolean
	{
		return !(this.lexemeService.store.active?.origin === LexemeOrigin.TopList && !!this.getTypeID() && !!this.getLangID());
	}
	changeToggleChanged(event: MatSlideToggleChange) : void
	{
		this.changeToggleChecked = event.checked;
		this.doEnabling();
	}

	// Lexeme link
	@ViewChild('lexemeLink')
	private lexemeLink: LexemeLinkComponent;
	getTypeID() : number {
		return this.generalForm.get('typeID')?.value;
	}
	getLangID() : number {
		return this.generalForm.get('langID')?.value;
	}

	// For tag component
	areTagsEditable: boolean = false;
	separatorKeysCodes: number[] = [ENTER, COMMA];
	tagCtrl = new FormControl();
	filteredTags: Observable<string[]>;
	tags: Set<string> = new Set([]);
	allTags: string[] = [];
	@ViewChild('tagInput')
	tagInput: ElementRef<HTMLInputElement>;


	constructor(private readonly formBuilder: FormBuilder, private lexemeService: LexemeService,
		public readonly data: DataService)
	{
		this.generalForm = this.formBuilder.group({
			id: [{value: '', disabled: true}],
			typeID: [null, Validators.required],
			langID: [null, Validators.required],
			parserID: [null, Validators.pattern("[a-zA-Z0-9-]+_[a-zA-Z0-9-]+")],
			tags: [[]],
			notes: [],
			showVariantDetailsFrom: [],
			active: [false, Validators.required],
		});
		this.filteredTags = this.tagCtrl.valueChanges.pipe(
			startWith(null),
			map((tag: string | null) => tag ? this._filterTags(tag) : this.allTags.slice()));
	}

	ngOnInit(): void
	{
		this.tagsSubscription = this.data.tags.subscribe(tags => {
			let allTags: string[] = [];
			for (let tag of tags) {
				allTags.push(tag.tag);
			}
			this.allTags = allTags;
		});
		this.valueChangesSubscription = this.generalForm.valueChanges.subscribe((value) => {
			this._errorCount = countErrors(this.generalForm);
			if (this._trackChanges === true) {
				this._changed = true;
			}
			this.writeTrackingDataToService();
		});

		this.typeSubscription = this.generalForm.controls['typeID'].valueChanges.subscribe(newValue => {       
			let oldValue = this.generalForm.value['typeID'];
			if (this._trackChanges && oldValue != newValue) {
				this.generalForm.get('showVariantDetailsFrom').setValue(null);
			}
	 	});

		 this.langSubscription = this.generalForm.controls['langID'].valueChanges.subscribe(newValue => {       
			let oldValue = this.generalForm.value['langID'];
			if (this._trackChanges && oldValue != newValue) {
				this.generalForm.get('showVariantDetailsFrom').setValue(null);
			}
	 	});

		// initial enabling/disabling
		this.doEnabling();
	}

	ngOnDestroy(): void
	{
		this.tagsSubscription.unsubscribe();
		this.langSubscription.unsubscribe();
		this.typeSubscription.unsubscribe();
		this.valueChangesSubscription.unsubscribe();
	}

	readFromService(lexeme: Lexeme) : void
	{
		this._trackChanges = false;

		// Reset this component
		this.resetComponent();
		if (lexeme) {
			// lexeme.tags must not be null because it makes the formarray throw exceptions
			if (lexeme.tags === null) {
				lexeme.tags = [];
			}
			// patch the values of the lexeme into the form
			this.generalForm.patchValue(lexeme);//, { emitEvent: false });
			// seems like each tag must be put back on its own into the set
			lexeme.tags?.forEach(tag => {
				this.tags.add(tag);
			});
			this.parserIdWasSet = !!lexeme.parserID && lexeme.parserID.length > 0;
			this._changed = lexeme.changed;
			this.doEnabling();
		}

		this._trackChanges = true;
	}

	writeToService(doValidation: boolean) : TransferStop[]
	{
		this._trackChanges = false;
		let active = this.lexemeService.store.active;
		// writing back only for TopList lexemes
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			if (doValidation && !this.generalForm.valid) {
				let stop = new TransferStop();
				stop.uitID = 'admin:err.tabGeneralInvalid';
				return [stop];
			}
			let values = this.generalForm.getRawValue();
			// WA0001
			let lexemeLinkValue = this.lexemeLink.getValue();
			if (values.showVariantDetailsFrom != lexemeLinkValue) {
				values.showVariantDetailsFrom = lexemeLinkValue;
			}
			if (values.parserID == '') {
				// ParserID must not be an empty string but then null instead
				values.parserID = null;
			}
			// Nested groups / form arrays must be assigned seperately (seems to be a bug: https://github.com/angular/angular/issues/12963)
			// TODO write automated test for this to see if it gets fixed in future releases
			// FormArray is currently not used anymore. But the tags must also each be taken from the tags set
			values.tags = [];
			this.tags.forEach(tag => values.tags.push(tag))
			this.lexemeService.writeToActiveLexeme('lexeme', values);
		}
		return [];
	}

	private writeTrackingDataToService() : void
	{
		let active = this.lexemeService.store.active;
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			// Attributes starting with __ are special in that they'll be removed before sending the data to the backend
			if (this._trackChanges && this._changed === true) {
				this.lexemeService.writeToActiveLexeme('lexeme', { changed: true, __errorCount: this._errorCount }, true);
			} else {
				this.lexemeService.writeToActiveLexeme('lexeme', { __errorCount: this._errorCount }, true);
			}
		} else {
			this._errorCount = 0;
			this._changed = false;
		}
	}

	typeSelected(event: MatSelectChange) : void
	{
		this.typeSelect.emit(event.value);
	}

	languageSelected(event: MatSelectChange) : void
	{
		this.languageSelect.emit(event.value);
	}

	addTag(event: MatChipInputEvent): void {
		const value = (event.value || '').trim();
		if (value) {
			this.tags.add(value);
			this._changed = true;
			this.writeTrackingDataToService();
		}
		// Clear the input value
		event.chipInput!.clear();
		this.tagCtrl.setValue(null);
	}

	removeTag(tag: string): void {
		this.tags.delete(tag);
	}

	tagSelected(event: MatAutocompleteSelectedEvent): void
	{
		this.tags.add(event.option.viewValue);
		this.tagInput.nativeElement.value = '';
		this.tagCtrl.setValue(null);
	}

	private _filterTags(value: string): string[]
	{
		const filterValue = value.toLowerCase();
		return this.allTags.filter(tag => tag.toLowerCase().includes(filterValue));
	}

	enableTypeIdAndLangId() : boolean
	{
		let result = false;
		if (this.lexemeService.store.active?.origin === LexemeOrigin.TopList) {
			result = (this.changeToggleChecked) || (!this.getTypeID() || !this.getLangID());
		}
		return result;
	}

	disableShowVariantDetailsFrom() : boolean
	{
		let result = true;
		if (this.lexemeService.store.active?.origin === LexemeOrigin.TopList) {
			result = !this.getTypeID() || !this.getLangID();
		}
		return result;
	}

	private doEnabling() : void
	{
		if (this.lexemeService.store.active?.origin === LexemeOrigin.TopList) {
			this.areTagsEditable = true;
			this.generalForm.enable({ emitEvent: false });
			this.generalForm.controls['id']?.disable({ onlySelf: true });
			//this.generalForm.controls['tags']?.enable({ onlySelf: true });
			this.tagCtrl.enable({ onlySelf: true });
			this.generalForm.markAllAsTouched();
			doEnablingControl(this.generalForm.controls['typeID'], !this.enableTypeIdAndLangId());
			doEnablingControl(this.generalForm.controls['langID'], !this.enableTypeIdAndLangId());
			doEnablingControl(this.generalForm.controls['parserID'], this.disableParserID());
			doEnablingControl(this.generalForm.controls['showVariantDetailsFrom'], this.disableShowVariantDetailsFrom());
		} else {
			this.areTagsEditable = false;
			this.generalForm.disable({ emitEvent: false });
			//this.generalForm.controls['tags']?.disable({ onlySelf: true });
			this.tagCtrl.disable({ onlySelf: true });
		}
	}

	// Was the parserID already set when the lexeme was loaded?
	private parserIdWasSet: boolean = false;
	disableParserID() : boolean
	{
		/*
		let parserIdSet = false;
		let parserIdCtrl = this.generalForm.get('parserID');
		if (parserIdCtrl && parserIdCtrl.value && `${parserIdCtrl.value}`.length > 0) {
			parserIdSet = true;
		}
		return this.lexemeService.isActiveLexemePersistent() && parserIdSet;
		*/
		return this.parserIdWasSet;
	}

	public resetComponent()
	{
		this._trackChanges = false;

		this.changeToggleChecked = false;
		// Toggle does basically not make sense anymore. One would have to create a new lexeme if they made a mistake.
		//this.changeToggle.checked = false;
		this.parserIdWasSet = false;
		
		// reset the general form and the formRef (for validation reset)
		this.formRef.resetForm();
		this.generalForm.reset();
		// the tags chip list has a seperate input element and control which need to be resetted, as well as the tags set
		this.tagCtrl.setValue(null, { onlySelf: true });
		if (this.areTagsEditable) {
			this.tagInput.nativeElement.value = '';
		}
		this.tags.clear();
		this.doEnabling();
	}
}