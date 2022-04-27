// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterViewInit, ChangeDetectorRef, Component, isDevMode, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { LangPair, Mapping, Sememe } from '@app/admin/_models/oapenwb-api';
import { DataService } from '@app/admin/_services/data.service';
import { LexemeOrigin, LexemeService } from '@app/admin/_services/lexeme.service';
import { KeyMap } from '@app/util/hashmap';
import { TranslocoService } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { SememeSupply } from '../tab-3-sememes/sememeSupply';
import { TransferStop } from '../view/view.component';
import { SememeService } from '@app/admin/_services/sememe.service';
import { ExtMapping, ThisThatMapping } from './ext-mapping';
import { TabSememesComponent } from '../tab-3-sememes/tab-sememes.component';
import { SHOW_CHANGE_DATA } from '../editor/editor.component';

@Component({
	selector: 'lex-tab-mappings',
	templateUrl: './tab-mappings.component.html',
	styleUrls: ['./tab-mappings.component.scss']
})
export class TabMappingsComponent implements OnInit, OnDestroy, AfterViewInit
{
	public readonly isDevMode: boolean = isDevMode();
	public readonly showChangeData = SHOW_CHANGE_DATA;
	editMode: boolean = false; // Is the component itself in edit mode?

	// Subscriptions
	private mappingFormSubtn: Subscription;
	private sememeAddedSubtn: Subscription;
	private sememeRemovedSubtn: Subscription;
	private langChangeSubtn: Subscription;
	private uitIdMap: KeyMap<string> = new KeyMap<string>();

	// Local data within component
	// TODO Should I restructure other components so they'll have those in the top, too?
	mappings: ExtMapping[] = [];
	langPairs: LangPair[] = [];

	// Method to prepare the sememe name
	prepare = TabSememesComponent.prepare;

	private collectLangPairs() : void
	{
		let langPairs = [];
		for (let langPair of this.data.store.langPairs.values) {
			if (langPair.langOneID == this._basedOnLanguage || langPair.langTwoID == this._basedOnLanguage) {
				langPairs.push(langPair);
			}
		}
		this.langPairs = langPairs;
	}

	getTargetLang(input: any) : string {
		let langPair: LangPair = null;
		if (typeof input == 'string') {
			// it's a langPair's ID
			langPair = this.data.store.langPairs.get(input)
		} else {
			// it's a langPair instance
			langPair = input;
		}
		let otherLangUit: string = null;
		if (langPair?.langOneID == this._basedOnLanguage) {
			otherLangUit = this.data.store.allLanguages.get(langPair.langTwoID)?.uitID;
		} else {
			otherLangUit = this.data.store.allLanguages.get(langPair?.langOneID)?.uitID;
		}
		if (!!otherLangUit) {
			return this.transloco.translate(`full.${otherLangUit}`);
		}
		return typeof input == 'string' ? input : input.id;
	}

	// Returns the ID of the other language of the langPair
	getOtherLang() : number
	{
		let id: string = this.mappingForm.get('langPair')?.value;
		if (!!id) {
			let langPair: LangPair = this.data.store.langPairs.get(id);
			if (!!langPair) {
				let twisted: boolean = langPair.langTwoID == this._basedOnLanguage;
				return twisted ? langPair.langOneID : langPair.langTwoID;
			}
		}
		return null;
	}

	// Formular: top form
	mappingForm: FormGroup;
	@ViewChild(FormGroupDirective, {static: false})
	_mappingFormRef: FormGroupDirective = null;
	get mappingFormRef() {
		return this._mappingFormRef;
	}
	set mappingFormRef(directive: FormGroupDirective) {
		if (!!directive) {
			this._mappingFormRef = directive;
		} else {
			this._mappingFormRef = null;
		}
	}

	//
	mixedCompare = (o1: any, o2: any) =>  o1 == o2;

	langPairSelected($event: MatSelectChange) : void
	{
		this.mappingForm.get('thatSememe').setValue(null);
		this.doEnablingForm();
		this.changeDetector.detectChanges();
	}

	// Index of currently edited mapping (from this.mappings), or -1 for none.
	editingIndex: number = -1;
	mappingAlreadyExists: boolean = false;

	onSubmit(): void
	{
		if (this.mappingFormRef.valid) {
			if (this.editingIndex == -1) {
				// Create a new mapping and store it
				let thisThat: ThisThatMapping = this.mappingForm.getRawValue();
				let twisted: boolean = this.data.store.langPairs.get(thisThat.langPair).langTwoID == this._basedOnLanguage;
				let mapping: Mapping = this.lexemeService.createMapping();
				this.thisThatToMapping(thisThat, mapping, twisted);
				let mappingExt = new ExtMapping(twisted, mapping);
				this.mappings.push(mappingExt);
				this.dataSource.data = this.mappings;
			} else {
				// Update the mapping and put it back into the array
				let mapping: ExtMapping = this.mappings[this.editingIndex];
				let thisThat: ThisThatMapping = this.mappingForm.getRawValue();
				let twisted: boolean = this.data.store.langPairs.get(thisThat.langPair).langTwoID == this._basedOnLanguage;
				this.thisThatToMapping(thisThat, mapping, twisted);
				mapping.twisted = twisted;
				mapping.apiAction = 'Update';
				this.mappings[this.editingIndex] = mapping;
				this.dataSource.data = this.mappings;
			}
			// Clear the form
			this.onClear();
			// For writing the tracking data
			this.lexemeService.writeToActiveLexeme('mappings', this.mappings, true);
		}
	}

	private thisThatToMapping(thisThat: ThisThatMapping, mapping: Mapping, twisted: boolean)
	{
		mapping.langPair = thisThat.langPair;
		mapping.weight = thisThat.weight;
		// Little hacky. The thatSememe would contain a sememe entity set by the SememeLinkComponent
		//thisThat.thatSememe = (thisThat.thatSememe as any).id;
		mapping.sememeOneID = twisted ? thisThat.thatSememe : thisThat.thisSememe;
		mapping.sememeTwoID = twisted ? thisThat.thisSememe : thisThat.thatSememe;
		mapping.changed = true;
	}

	onClear(): void
	{
		this.resetForm();
		this.doEnablingForm();
	}


	// Sememes component
	private _sememeSupply: SememeSupply;
	set sememeSupply(supply: SememeSupply) {
		this._sememeSupply = supply;
		// Subscribe to the emitters
		this.sememeAddedSubtn = supply.addedEmitter.subscribe(variant => this.sememeAdded);
		this.sememeRemovedSubtn = supply.removedEmitter.subscribe(variant => this.sememeRemoved);
	}

	// Error counting
	private _errors: number = 0;
	public get errors() : number { return this._errors; }
	private setErrors(errors: number) : void {
		if (this._errors !== errors) {
			this._errors = errors;
		}
	}
	// Are changes tracked right now?
	private _trackChanges: boolean = false;
	get trackChanges() : boolean {
		return this._trackChanges;
	}
	// Was the data (Sememe or SynGroup) in this tab changed since last creating, loading or saving?
	private _changed: boolean = false;
	get changed() : boolean {
		return this._changed;
	}
	private _trackErrors: boolean = false;
	public get trackErrors() : boolean {
		return this._trackErrors;
	}

	// Type data
	private _basedOnType: number; // will be set through the editor
	public set basedOnType(lexemeTypeID: number) {
		this._basedOnType = lexemeTypeID;
		this.doEnabling();
	}

	// Language data
	private _basedOnLanguage: number = null; // will be set through the editor
	public get basedOnLanguage() {
		return this._basedOnLanguage;
	}
	public set basedOnLanguage(languageID: number) {
		let oldValue = this._basedOnLanguage;
		this._basedOnLanguage = languageID;
		if (oldValue != languageID) {
			this.collectLangPairs();
		}
		this.doEnabling();
	}

	// Sememe data
	get sememesControl() {
		return this.mappingForm.get('thisSememe');
	}
	get sememes() {
		if (!!this._sememeSupply) {
			return this._sememeSupply.sememes;
		}
		return [];
	}
	get sememeNames() {
		if (!!this._sememeSupply) {
			return this._sememeSupply.sememeNames;
		}
		return [];
	}
	private sememeAdded(variant: Sememe)
	{
	}
	private sememeRemoved(variant: Sememe)
	{
		/* TODO iterate over the mappings
		   And remove the sememe (set it to null) and set an error for each of these mappings and write it into the service!
		for (let mapping of this.mappings) {
			let index = sememe.variantIDs.indexOf(variant.id);
			if (index != -1) {
				sememe.variantIDs.splice(index, 1);
				// For all apiActions besides 'None' there is nothing to change here
				if (sememe.apiAction == 'None') {
					sememe.apiAction = 'Update';
				}
			}
		}
		*/
	}

	// Mapping table
	@ViewChild(MatSort)
	sort: MatSort;
	displayedColumns = ['thisSememe', 'langPair', 'thatSememe', 'weight', 'actions'];
	dataSource = new MatTableDataSource<ExtMapping>();

	editClicked(mapping: ExtMapping, index: number) : void
	{
		this.resetForm();
		this.editingIndex = index;
		let thisThat: ThisThatMapping = {
			thisSememe: mapping.thisSememe,
			langPair: mapping.langPair,
			thatSememe: mapping.thatSememe,
			weight: mapping.weight
		};
		this.mappingForm.patchValue(thisThat);
		this.doEnablingForm();
	}

	deleteClicked(mapping: ExtMapping, index: number) : void
	{
		if (mapping.apiAction == 'Insert') {
			if (this.editingIndex == index) {
				this.onClear();
			} else if (this.editingIndex > index) {
				this.editingIndex--;
			}
			this.mappings.splice(index, 1);
		} else {
			mapping.apiAction = 'Delete';
			mapping.changed = true;
		}
		this.dataSource.data = this.mappings;

		// For writing the tracking data
		this.lexemeService.writeToActiveLexeme('mappings', this.mappings, true);
	}

	getThisCaption(id: number) : string
	{
		for (let i = 0; i < this.sememes.length; i++) {
			let sememe = this.sememes[i];
			if (sememe.id == id) {
				return this.prepare(this.sememeNames[i], this.transloco);
			}
		}
		return '(ERR)';
	}

	getThatCaption(id: number) : string
	{
		let result = '';
		let sememe = this.sememeService.getCachedSlim(id);
		if (!!sememe) {
			result = this.prepare(sememe.internalName, this.transloco);
			result += sememe.active ? ' 🟢' : ' 🔴';
			result += ' (';
			if (sememe.pre != null) {
				result += sememe.pre + ' ';
			}
			result += sememe.main;
			if (sememe.post != null) {
				result += ' ' + sememe.post;
			}
			result += sememe.lexActive ? ' 🟢' : ' 🔴';
			result += ')';
			return result;
		} else {
			result = '(ERR)';
		}
		return result;
	}

	getWeightTranslation(weight: number) : string
	{
		if (weight == 90) {
			return this.uitIdMap.get('admin.weight:almostAlways');
		} else if (weight == 70) {
			return this.uitIdMap.get('admin.weight:often');
		} else if (weight == 50) {
			return this.uitIdMap.get('admin.weight:common');
		} else if (weight == 30) {
			return this.uitIdMap.get('admin.weight:lessCommon');
		} else if (weight == 10) {
			return this.uitIdMap.get('admin.weight:rare');
		} else {
			return '' + weight;
		}
	}

	constructor(private readonly changeDetector: ChangeDetectorRef, private readonly formBuilder: FormBuilder,
		public readonly transloco: TranslocoService, private readonly lexemeService: LexemeService,
		public readonly data: DataService, public readonly sememeService: SememeService)
	{
		this.mappingForm = this.formBuilder.group({
			//id: [{value: '', disabled: true}],
			thisSememe: [null, Validators.required],
			langPair: [null, Validators.required],
			//__twisted: [null],
			thatSememe: [null, Validators.required],
			weight: [null, Validators.required]
		} /*, { updateOn: 'blur' } */);
	}

	ngOnInit(): void
	{
		this.mappingFormSubtn = this.mappingForm.valueChanges.subscribe(something => {
			// Check if there already is a sememe pair
			let thisSememe = this.mappingForm.get('thisSememe').value;
			let thatSememe = this.mappingForm.get('thatSememe').value;
			this.mappingAlreadyExists = false;
			for (let mapping of this.mappings) {
				if (mapping.apiAction != 'Delete' && mapping.thisSememe == thisSememe && mapping.thatSememe == thatSememe)
				{
					this.mappingAlreadyExists = true;
					break;
				}
			}
		});

		// Get the translation for the term 'sememe'
		this.langChangeSubtn = this.transloco.langChanges$.subscribe(lang => {
			this.retrieveTranslations();
		});
		this.retrieveTranslations();

		this.dataSource.filterPredicate = (mapping: ExtMapping, filter: string) => {
			return !!mapping && mapping.apiAction != 'Delete';
		};
		this.dataSource.filter = 'default';
	}

	private retrieveTranslations() : void
	{
		this.uitIdMap = new KeyMap<string>();
		this.retrieveTranslation('admin.weight:almostAlways');
		this.retrieveTranslation('admin.weight:often');
		this.retrieveTranslation('admin.weight:common');
		this.retrieveTranslation('admin.weight:lessCommon');
		this.retrieveTranslation('admin.weight:rare');
	}

	private retrieveTranslation(key: string)
	{
		let translation = this.transloco.translate(key);
		if (!!translation) {
			this.uitIdMap.add(key, translation);
		} else {
			let missingText = this.transloco.translate('admin.missingUIT', { key: key });
			this.uitIdMap.add(key, missingText);
		}
	}

	ngAfterViewInit(): void
	{
		this.dataSource.sort = this.sort;
	}

	ngOnDestroy(): void
	{
		this.mappingFormSubtn.unsubscribe();
		this.sememeAddedSubtn.unsubscribe();
		this.sememeRemovedSubtn.unsubscribe();
		this.langChangeSubtn.unsubscribe();
	}

	// TODO 003
	readFromService(typeID: number, langID: number, mappings: Mapping[]) : void
	{
		this._trackChanges = false;
		this._trackErrors = false;

		// Reset the sememe cache
		this.sememeService.resetSlimCache();

		// Reset this component
		this.resetComponent();

		this.editMode = this.lexemeService.store.active?.origin === LexemeOrigin.TopList;
		let extMappings: ExtMapping[] = [];
		for (let mapping of mappings) {
			// Add the sememes to cache
			this.sememeService.addSlimToCache(mapping.sememeOne);
			this.sememeService.addSlimToCache(mapping.sememeTwo);
			// Create and ExtMapping
			extMappings.push(new ExtMapping(
				this.data.store.langPairs.get(mapping.langPair)?.langTwoID == langID,
				mapping
			));
		}
		this.mappings = extMappings;
		this.dataSource.data = this.mappings;

		this.basedOnType = typeID;
		this.basedOnLanguage = langID;

		this._trackErrors = true;
		this.doEnabling();
		this._trackChanges = true;
	}

	writeToService(doValidation: boolean) : TransferStop[]
	{
		this._trackChanges = false;
		this._trackErrors = false;
		let active = this.lexemeService.store.active;
		// writing back only for TopList lexemes
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			if (doValidation && !this.mappingForm.valid) {
				let stop = new TransferStop();
				stop.uitID = 'admin:err.tabMappingsInvalid';
				return [stop];
			}
			this.lexemeService.writeToActiveLexeme('mappings', this.mappings, true);
		}
		
		return [];
	}

	private doEnabling() : void
	{
		let baseConfigSet = this._basedOnType && this._basedOnLanguage;
		if (this.editMode && baseConfigSet) {
			// only active when type and language are set on the general form
			// TODO
			this.doEnablingForm();
			// TODO Enable actions on table
		} else {
			this.mappingForm.disable({ emitEvent: false });
			// TODO Disable actions on table
		}
		this._errors = 0; // TODO countErrors(this.mappingForm);
	}

	private doEnablingForm() : void
	{
		this.mappingForm.enable({ emitEvent: false });
		let langPair = this.mappingForm.get('langPair').value;
		if (!langPair) {
			this.mappingForm.get('thatSememe').disable();
		}
		if (this.editingIndex != -1) {
			this.mappingForm.get('thisSememe').disable();
			this.mappingForm.get('thatSememe').disable();
		}
		//this.mappingForm.markAllAsTouched();
	}

	public resetComponent() : void
	{
		this.editMode = false;
		this._changed = false;
		// Reset the selected sememe
		this.mappingForm.reset();
		this.mappingAlreadyExists = false;
		// Reset type, language and dialect cache variables
		this.mappings = [];
		this._basedOnType = null;
		this._basedOnLanguage = null;
		// Reset the form and do the enabling stuff
		this.resetForm();
		// Reset the table
		this.dataSource.data = [];

		this.doEnabling();
		// TODO 002
		this.changeDetector.detectChanges();
	}

	private resetForm() : void
	{
		this.editingIndex = -1;
		this.mappingAlreadyExists = false;
		if (!!this.mappingFormRef) {
			this.mappingFormRef.resetForm();
		}
		this.mappingForm.reset({ weight: 50 });
	}
}