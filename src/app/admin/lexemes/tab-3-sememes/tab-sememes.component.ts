// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, isDevMode, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectChange, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { LexemeType, Sememe, SynGroup, Variant } from '@app/admin/_models/admin-api';
import { DataService, ExtCategory } from '@app/admin/_services/data.service';
import { LexemeOrigin, LexemeService } from '@app/admin/_services/lexeme.service';
import { ReplaySubject, Subscription, takeUntil } from 'rxjs';
import { TransferStop } from '../view/view.component';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { ApiAction } from '@app/admin/_models/enums';
import { countErrors, doEnablingControl, transferValues } from '@app/admin/_util/form-utils';
import { VariantSupply } from '../tab-2-variants/variantSupply';
import { Selection, SynGroupLinkComponent } from '@app/admin/_components/syn-group-link/syn-group-link.component';
import { LemmaService } from '@app/_services/lemma.service';
import { SememeSupply } from './sememeSupply';
import { SememeService } from '@app/admin/_services/sememe.service';
import { SHOW_CHANGE_DATA } from '../editor/editor.component';
import { SememeLinkComponent } from '@app/admin/_components/sememe-link/sememe-link.component';
import { SynGroupQueryService } from '@app/admin/_services/syn-group-query.service';
import { DialectsSelectComponent } from '@app/admin/_components/dialects-select/dialects-select.component';
import { HierarchicalSelectComponent } from '@app/admin/_components/hierarchical-select/hierarchical-select.component';
import { LemmaComponentComponent } from '../../../shared/_components/lemma-component/lemma-component.component';
import { SynGroupLinkComponent as SynGroupLinkComponent_1 } from '../../_components/syn-group-link/syn-group-link.component';
import { LexemeLinkComponent } from '../../_components/lexeme-link/lexeme-link.component';
import { HierarchicalSelectComponent as HierarchicalSelectComponent_1 } from '../../_components/hierarchical-select/hierarchical-select.component';
import { DialectsSelectComponent as DialectsSelectComponent_1 } from '../../_components/dialects-select/dialects-select.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatInput } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { MatButton } from '@angular/material/button';
import { MatBadge } from '@angular/material/badge';
import { MatOption } from '@angular/material/core';
import { NgFor, NgIf } from '@angular/common';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';

class InnerCategory
{
	id: number;
	uitID_abbr: string;
	uitID: string;
	level: number;
}

export type SpecificsType = "Verb";

// TODO How to get this into admin-api.ts for Sememe#fillSpec?
export enum FillSpecType {
	NoSpec = 1,
	FromTemplate = 2,
	Manually = 3,
}

@Component({
    selector: 'lex-tab-sememes',
    templateUrl: './tab-sememes.component.html',
    styleUrls: ['./tab-sememes.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, MatFormField, MatLabel, MatSelect, NgFor, NgIf, MatOption, MatBadge, MatButton, MatDivider, FormsModule, ReactiveFormsModule, MatInput, MatHint, MatSlideToggle, DialectsSelectComponent_1, MatSelectTrigger, HierarchicalSelectComponent_1, LexemeLinkComponent, SynGroupLinkComponent_1, LemmaComponentComponent]
})
export class TabSememesComponent implements OnInit, OnDestroy, SememeSupply
{
	public readonly isDevMode: boolean = isDevMode();
	public readonly showChangeData = SHOW_CHANGE_DATA;

	private _sgSememes: string = null;
	get sgSememes() : string
	{
		if (!this._sgSememes) {
			let synGroup = this.sememes[this.selectedSememe]?.synGroup;
			if (!!synGroup && !!synGroup.sememeIDs) {
				let sememes = '';
				let first = true;
				for (let sememeID of synGroup.sememeIDs) {
					if (first) {
						first = false;
					} else {
						sememes += '; ';
					}
					let slimSememe = this.sememeService.getCachedSlim(sememeID);
					if (!slimSememe) {
						// A slim sememe is not yet in the cache…
						return this.transloco.translate('admin.loading');
					}
					sememes += SememeLinkComponent.FormatPresentation(this.data, this.transloco, slimSememe);
				}
				this._sgSememes = sememes;
			}
		}
		return this._sgSememes;
	}

	sgPresentation() : string
	{
		let lemmaStr: string = this.synGroupForm.get('presentation')?.value;
		return this.lemmaService.formatLemmaStr(lemmaStr);
	}

	public static prepare(sememeName: string, transloco: TranslocoService) : string
	{
		if (!!sememeName && sememeName.indexOf('$default') >= 0) {
			let uit = transloco.translate('admin.commonDefault');
			uit = !!uit || uit == 'admin.commonDefault' ? uit : 'Common Default';
			sememeName = sememeName.replace('$default', uit);
		}
		return sememeName;
	}
	prepare = TabSememesComponent.prepare;

	// Formular: sememe form
	readonly sememeForm = new FormGroup({
		id: new FormControl<number|null>({ value: null, disabled: true }),
		internalName: new FormControl('', Validators.required),
		variantIDs: new FormControl<number[]|null>(null, Validators.required),
		dialectIDs: new FormControl<number[]|null>(null),
		levelIDs: new FormControl<number[]|null>(null),
		categoryIDs: new FormControl<number[]|null>(null),
		fillSpec: new FormControl<FillSpecType>(FillSpecType.NoSpec, { nonNullable: true }),
		specTemplate: new FormControl<string|null>(null),
		spec: new FormControl<string|null>(null),
		active: new FormControl<boolean|null>(null),
	});
	@ViewChild(FormGroupDirective)
	sememeFormRef: FormGroupDirective;

	// Formular: specifics form
	specificsForm: FormGroup;
	specificsType: SpecificsType = null;
	caseGovType: LexemeType = null;

	// Component: dialects select
	@ViewChild('dialectsSelect')
	private dialectsSelect: DialectsSelectComponent;

	// Component: dialects select
	@ViewChild('categoriesSelect')
	private categoriesSelect: HierarchicalSelectComponent;

	// SynGroup form control
	public synGroupCtrl = new FormControl<Selection|null>(null);
	// Formular: synonym group form
	readonly synGroupForm = new FormGroup({
		// id: new FormControl({value: '', disabled: true}),	// not needed in the formGroup, might even lead to problems
		// sememeIDs: new FormControl<number[]|null>(null),		// cannot be part of the formGroup in current code design as its empty…
																// …value would overwrite the sememeIDs in a newly created SynGroup
		description: new FormControl<string|null>(null),              	// used to edit the SynGroup's description
		presentation: new FormControl({value: '', disabled: true}),		// used for the presentation
	});
	@ViewChild(FormGroupDirective)
	synGroupFormRef: FormGroupDirective;

	synGroupChange(synGroup: SynGroup)
	{
		let doEnabling = false;
		if (!!synGroup) {
			//if (synGroup.id != this.synGroupForm.get('id').value?.id) {
				this.synGroupForm.patchValue(synGroup);
				if (this._trackChanges === true) {
					// Hyr müs ik wul noch kyken wo ik dår med ümgå... evtl. kumt dat event to laat,
					// as dat ni direkt up klik man dat låden van de SynGroup kumt.
					this._sememeChanged = true;
					this._synGroupChanged = true;
				}
				doEnabling = true;
			//}
		} else {
			//if (!!this.synGroupForm.get('id').value) {
				// A SynGroup was set before and now is not
				this.synGroupForm.reset();
				if (this._trackChanges === true) {
					this._sememeChanged = true;
				}
				doEnabling = true;
			//}
		}
		if (doEnabling) {
			// TODO 1337 this.writeTrackingDataToService();
			this.doEnabling();
		}
	}

	//
	@ViewChild('synGroupLink')
	private synGroupLink: SynGroupLinkComponent;

	// Variants component
	private _variantSupply: VariantSupply;
	set variantSupply(supply: VariantSupply) {
		this._variantSupply = supply;

		// Subscribe to the emitters
		supply.addedEmitter.pipe(
			takeUntil(this.destroy$),
		).subscribe(variant => this.variantAdded);
		supply.removedEmitter.pipe(
			takeUntil(this.destroy$),
		).subscribe(variant => this.variantRemoved);
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
	private _sememeChanged = false;
	get sememeChanged(): boolean {
		return this._sememeChanged;
	}
	private _synGroupChanged = false;
	get synGroupChanged(): boolean {
		return this._synGroupChanged;
	}
	get changed(): boolean {
		return this._sememeChanged || this._synGroupChanged;
	}
	private _trackErrors: boolean = false;
	public get trackErrors() : boolean {
		return this._trackErrors;
	}

	// Type data
	private _basedOnType: number; // will be set through the editor
    public set basedOnType(lexemeTypeID: number) {
		let oldValue = this._basedOnType;
		this._basedOnType = lexemeTypeID;
		if (/*!oldValue &&*/ oldValue != lexemeTypeID) {
			let type = this.data.store.lexemeTypes.get(lexemeTypeID);
			if (!!type && type.name == 'VERB') {
				this.specificsType = 'Verb';
			} else {
				this.specificsType = null;
			}
			this.buildSpecificForm();
		}
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
		if (!oldValue && oldValue != languageID) {
			if (this.sememes.length == 1) {
				// Set the internal name of the default sememe
				const lang = this.data.store.allLanguages.get(languageID);
				if (!!lang) {
					this.sememes[0].internalName = '$default';
					this.updateSememeName(0);
					if (this.selectedSememe == 0) {
						this.sememeForm.get('internalName')?.setValue('$default');
					}
				}
			}
		}
		this.doEnabling();
    }

	// Variant data
	get variantsControl() {
		return this.sememeForm.get('variantIDs');
	}
	get variants() {
		if (!!this._variantSupply) {
			return this._variantSupply.variants;
		}
		return [];
	}
	get variantNames() {
		if (!!this._variantSupply) {
			return this._variantSupply.variantNames;
		}
		return [];
	}
	private variantAdded(variant: Variant)
	{
	}
	private variantRemoved(variant: Variant)
	{
		for (let sememe of this.sememes) {
			let index = sememe.variantIDs.indexOf(variant.id);
			if (index != -1) {
				sememe.variantIDs.splice(index, 1);
				// For all apiActions besides 'None' there is nothing to change here
				if (sememe.apiAction == 'None') {
					sememe.apiAction = 'Update';
				}
			}
		}
	}

	// Level data
	get levelsControl() {
		return this.sememeForm.get('levelIDs');
	}

	editMode: boolean = false;
	// the sememes once they are set
	sememes: Sememe[] = [];
	sememeNames: string[] = [];
	selectedSememe: number = 0;
	sememeCompare = (o1: any, o2: any) => o1 == o2;
	selectedSememeID() : number {
		return this.selectedSememe != -1 ? this.sememes[this.selectedSememe]?.id : null;
	}

	@Output() private _addedEmitter = new EventEmitter<Sememe>();
	get addedEmitter(): EventEmitter<Sememe> {
		return this._addedEmitter;
	}
	@Output() private _removedEmitter = new EventEmitter<Sememe>();
	get removedEmitter(): EventEmitter<Sememe> {
		return this._removedEmitter;
	}

	// Compare function for the fill lemma property
	fillSpecCompare = (o1: any, o2: any) => o1 == o2;

	private readonly destroy$ = new ReplaySubject<void>(1);

	constructor(
		private readonly changeDetector: ChangeDetectorRef,
		public readonly transloco: TranslocoService,
		private readonly lexemeService: LexemeService,
		public readonly data: DataService,
		private readonly lemmaService: LemmaService,
		private readonly sememeService: SememeService,
		private readonly synGroupService: SynGroupQueryService,
	) {
		this.buildSpecificForm();
	}

	private specificsFormSubscription: Subscription = undefined;

	private buildSpecificForm() : void
	{
		this.specificsFormSubscription?.unsubscribe();
		this.specificsFormSubscription = undefined;

		switch (this.specificsType) {
			case 'Verb':
				this.specificsForm = new FormGroup({
					caseGovernment: new FormControl<number|null>(null), // ID of a lexeme of type iCG
				});

				this.specificsFormSubscription = this.specificsForm.valueChanges.subscribe(() => {
					this._errors = countErrors(this.sememeForm);
					if (this._trackChanges === true) {
						this._sememeChanged = true;
					}
					this.writeTrackingDataToService();
				});
				break;
			
			default:
				this.specificsForm = new FormGroup({
				});
				break;
		}
	}

	ngOnInit(): void
	{
		this.data.loading.pipe(
			takeUntil(this.destroy$),
		).subscribe(isLoading => {
			this.caseGovType = this.data.store.lexemeTypesByName.get('iCG');
		});

		this.sememeForm.valueChanges.pipe(
			takeUntil(this.destroy$),
		).subscribe(() => {
			this._errors = countErrors(this.sememeForm);
			if (this._trackChanges === true) {
				this._sememeChanged = true;
			}
			this.writeTrackingDataToService();
		});

		this.synGroupForm.valueChanges.pipe(
			takeUntil(this.destroy$),
		).subscribe(() => {
			// Currently there cannot be any errors in the SynGroup form, so we don't count them
			if (this._trackChanges === true) {
				this._sememeChanged = true; // This is not optimal and should be changed in the future. But that'd also mean to change
				                            // the backend to handle unchanged sememes.
				this._synGroupChanged = true;
			}
			this.writeTrackingDataToService();
		});
		// initial enabling/disabling
		this.doEnabling();
	}

	ngOnDestroy(): void
	{
		this.specificsFormSubscription?.unsubscribe();

		this.destroy$.next();
		this.destroy$.complete();
	}

	// TODO 003
	readFromService(typeID: number, langID: number, sememes: Sememe[]) : void
	{
		this._trackChanges = false;
		this._trackErrors = false;

		// Reset this component
		this.resetComponent();

		this.editMode = this.lexemeService.store.active?.origin === LexemeOrigin.TopList;
		this.sememeNames = new Array(sememes.length).fill(null);
		this.sememes = sememes ? sememes : [];

		this.basedOnType = typeID;
		this.basedOnLanguage = langID;
		this.activateSememe(this.selectedSememe);
		// Enabling tracking is done in activateSememe()

		// Build the sememes' names
		for (let i = 0; i < this.sememeNames.length; i++) {
			this.sememeNames[i] = this.buildSememeName(i);
		}
	}

	private activateSememe(index: number)
	{
		this._trackChanges = false;
		this._trackErrors = false;
		if (this.selectedSememe != index) {
			// store the currently active sememe when there is a selection change
			this.storeActiveSememe();
			this.resetForms();
		}
		// The actual activation of mainVariant or else another variant
		if (index < 0 || index >= this.sememes.length) {
			index = 0;
		}
		// activate the selected sememe
		this.selectedSememe = index;
		let sememe = this.sememes[index];
		if (sememe) {
			// patch the values of the sememe into the forms
			this._trackErrors = true;
			this.sememeForm.patchValue(sememe);
			this._sememeChanged = sememe.changed;
			// also set the SynGroup
			if (sememe.synGroup) {
				let synGroup = sememe.synGroup;
				this._synGroupChanged = synGroup.changed;
				this.synGroupLink.synGroup = synGroup;
				this.synGroupForm.patchValue(synGroup);
				this.synGroupService.loadSlimSememes(sememe.synGroup);
			}
			// read type specific stuff
			if (!!sememe.properties) {
				if (this.specificsType == 'Verb') {
					this.specificsForm.patchValue(sememe.properties);
				}
			}
		}
		this._trackErrors = true;
		this.doEnabling();
		this._trackChanges = true;
	}

	// TODO 003
	writeToService(doValidation: boolean) : TransferStop[]
	{
		this._trackChanges = false;
		this._trackErrors = false;
		let active = this.lexemeService.store.active;
		// writing back only for TopList lexemes
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			if (doValidation && !this.sememeForm.valid) {
				let stop = new TransferStop();
				stop.uitID = 'admin:err.tabSememesInvalid';
				return [stop];
			}
			this.storeActiveSememe();
		}
		return [];
	}

	// TODO 003
	private writeTrackingDataToService() : void
	{
		let active = this.lexemeService.store.active;
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			if (this._trackChanges && this._sememeChanged) {
				let activeSememe = this.sememes[this.selectedSememe];
				activeSememe.changed = true;
				if (activeSememe.apiAction == ApiAction.None) {
					activeSememe.apiAction = ApiAction.Update;
				}
			}

			if (this._trackChanges && this._synGroupChanged) {
				if (!!this.synGroupLink && !!this.synGroupLink.synGroup) {
					let synGroup = this.synGroupLink.synGroup;
					synGroup.changed = true;
					if (synGroup.apiAction == ApiAction.None) {
						synGroup.apiAction = ApiAction.Update;
					}
				}
			}

			if (this._trackErrors) {
				// Attributes starting with __ are special in that they'll be removed before sending the data to the backend
				this.sememes[this.selectedSememe]['__errorCount'] = this.errors;
			}

			if (this.trackChanges || this.trackErrors) {
				// Right now all we can do is write back all sememes to the lexemeService.
				// But we do not update all values, though. That's done only in storeActiveSememe().
				this.lexemeService.writeToActiveLexeme('sememes', this.sememes, true);
			}
		} else {
			this._errors = 0;
			this._sememeChanged = false;
			this._synGroupChanged = false;
		}
	}

	private storeActiveSememe() : void
	{
		this._trackChanges = false;
		let active = this.lexemeService.store.active;
		// writing back only for TopList lexemes
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			let sememeValues = this.sememeForm.getRawValue();
			// Nested groups / form arrays must be assigned seperately (seems to be a bug: https://github.com/angular/angular/issues/12963)
			// TODO write automated test for this to see if it gets fixed in future releases
			//values.tags = this.tagsControls.value;
			//this.lexemeService.writeToActiveLexeme('lexeme', values);

			// Copy all formular data into the active sememe
			let activeSememe = Object.assign({}, this.sememes[this.selectedSememe]);
			transferValues(sememeValues, activeSememe);

			// Also transfer the SynGroup data
			if (!!this.synGroupLink.synGroup) {
				let synGroup = this.synGroupLink.synGroup;
				let synGroupValues = this.synGroupForm.getRawValue();
				transferValues(synGroupValues, synGroup);
				activeSememe.synGroup = synGroup;
			} else {
				activeSememe.synGroup = null;
			}

			// write type specific stuff
			activeSememe.properties = this.specificsForm.getRawValue();

			// And put the sememe into the sememes array
			this.sememes[this.selectedSememe] = activeSememe;
			// Write - actually - all sememes back to the active lexeme
			this.lexemeService.writeToActiveLexeme('sememes', this.sememes);
			// Update the sememe's name
			this.updateSememeName();
		}
	}

	sememeSelected(event: MatSelectChange) : void
	{
		this.activateSememe(event.value);
	}

	canAddSememe() : boolean
	{
		let result = false;
		if (this._basedOnType && this._basedOnLanguage && this.editMode) {
			result = true;
		}
		return result;
	}

	canRemoveSememe() : boolean
	{
		return this.canAddSememe() && (this.sememes != null && this.sememes.length > 1);
	}

	addSememe() : void
	{
		// Store the active sememe
		this.storeActiveSememe();
		// Create a new sememe
		let sememe = this.sememeService.createSememe();
		// Add the new sememe to internal structures
		this.sememeNames.push('–');
		this.sememes.push(sememe);
		let index = this.sememes.length - 1;
		this.sememeNames[index] = this.buildSememeName(index);
		this.activateSememe(index);
		// Publish the new sememe
		this._addedEmitter.emit(sememe);
	}

	removeSememe() : void
	{
		if (this.selectedSememe >= 0 && this.selectedSememe < this.sememes.length) {
			if (this.sememes[this.selectedSememe].apiAction == ApiAction.Insert) {
				// Keep the index of the sememe to remove
				let oldIndex = this.selectedSememe;
				let sememe = this.sememes[oldIndex];
				// Change to the first sememe so the UI will not try to show a removed sememe
				this.activateSememe(0);
				// Completely remove the sememe from the two arrays since it was newly created and is
				// unknown to the backend.
				this.sememes.splice(oldIndex, 1);
				this.sememeNames.splice(oldIndex, 1);
				// Emit the removed variant
				this._removedEmitter.emit(sememe);
			} else {
				let sememe = this.sememes[this.selectedSememe];
				// For other sememes that were already known to the backend the apiAction will be set to Delete
				this.sememes[this.selectedSememe].apiAction = ApiAction.Delete;
				this.activateSememe(0);
				// Emit the removed sememe
				this._removedEmitter.emit(sememe);
			}
		}
	}

	updateSememeName(index: number = null) : void
	{
		if (!index) {
			index = this.selectedSememe;
		}
		let name = this.buildSememeName(index);
		if (name && name !== this.sememeNames[index]) {
			this.sememeNames[index] = name;
			this.changeDetector.detectChanges();
		}
	}

	buildSememeName(index: number) : string
	{
		if (index >= this.sememes.length) {
			return '– ERR –';
		}

		let sememe = this.sememes[index];
		if (!!sememe) {
			let baseForm = !!sememe.internalName ? sememe.internalName : 'Sememe ' + (index+1);
			let name = baseForm; // + ' | ' + orthography + ' | ' + dialects;
			return name;
		}
		return '– ERR –';
	}

	disableLevels() : boolean
	{
		if (this.data.store.levels.values?.length > 0) {
			return false;
		}
		return true;
	}

	level_uitID_abbr(levelID: number) : string
	{
		return this.data.store.levels.get(levelID)?.uitID_abbr;
	}

	fillSpecSelected(event: MatSelectChange) : void
	{
		this.doEnabling();
	}

	/**
	 * Recursively collects the categories.
	 * 
	 * @param category 
	 * @param resultingCategories 
	 * @param level 
	 */
	private static collectCategories(category: ExtCategory, resultingCategories: InnerCategory[], level: number): void
	{
		if (category) {
			resultingCategories.push({
				id: category.id,
				uitID_abbr: category.uitID_abbr,
				uitID: category.uitID,
				level: level
			});
			if (category._children) {
				for (let child of category._children) {
					this.collectCategories(child, resultingCategories, level+1);
				}
			}
		}
	}

	private doEnabling() : void
	{
		let baseConfigSet = this._basedOnType && this._basedOnLanguage;
		if (this.editMode && baseConfigSet) {
			// only active when type and language are set on the general form
			this.doEnablingSememe();
			this.doEnablingSpecifics();
			this.doEnablingSynGroup();
		} else {
			this.sememeForm.disable({ emitEvent: false });
			this.specificsForm.disable({ emitEvent: false });
			this.synGroupCtrl.disable({ emitEvent: false });
			this.synGroupForm.disable({ emitEvent: false });
		}
		this._errors = countErrors(this.sememeForm);
		this.writeTrackingDataToService();
	}

	private doEnablingSememe() : void
	{
		this.synGroupCtrl.enable({ emitEvent: false });
		this.sememeForm.enable({ emitEvent: false });
		this.sememeForm.markAllAsTouched();

		doEnablingControl(this.sememeForm.controls['dialectIDs'], !this.dialectsSelect.hasItems());
		doEnablingControl(this.sememeForm.controls['levelIDs'], this.disableLevels());
		doEnablingControl(this.sememeForm.controls['categoryIDs'], !this.categoriesSelect.hasItems());

		// Specification text controls
		let fillSpec = this.sememeForm.get('fillSpec')?.value;
		if (fillSpec == 1) {
			this.sememeForm.get('specTemplate').disable({ emitEvent: false });
			this.sememeForm.get('spec').disable({ emitEvent: false });
		} else if (fillSpec == 2) {
			this.sememeForm.get('specTemplate').enable({ emitEvent: false });
			this.sememeForm.get('specTemplate').markAsTouched();
			this.sememeForm.get('spec').disable({ emitEvent: false });
		} else if (fillSpec == 3) {
			this.sememeForm.get('specTemplate').disable({ emitEvent: false });
			this.sememeForm.get('spec').enable({ emitEvent: false });
			this.sememeForm.get('spec').markAsTouched();
		}
	}

	private doEnablingSpecifics() : void
	{
		this.specificsForm.enable({ emitEvent: false });
	}

	private doEnablingSynGroup() : void
	{
		if (!!this.synGroupLink.synGroup) {
			// TODO:SG Check if the user has the lock for the entity (if it's not on INSERT)
			this.synGroupForm.enable({ emitEvent: false });
			this.synGroupForm.markAllAsTouched();
		} else {
			this.synGroupForm.disable({ emitEvent: false });
		}
		//doEnablingControl(this.synGroupForm.controls['presentation'], true);
	}

	public resetComponent() : void
	{
		this.editMode = false;
		this._sememeChanged = false;
		this._synGroupChanged = false;
		this._sgSememes = null;
		this.specificsType = null;
		// Reset the selected sememe
		this.selectedSememe = -1;
		// Reset type, language and dialect cache variables
		this.sememes = [];
		this.sememeNames = [];
		this._basedOnType = null;
		this._basedOnLanguage = null;
		// Reset the SynGroupLink
		this.synGroupLink.resetComponent();
		// Reset the forms and do the enabling stuff
		this.resetForms();
		this.doEnabling();
		// TODO 002
		this.changeDetector.detectChanges();
	}

	private resetForms() : void
	{
		this._trackChanges = false;
		// reset the sememe form and the formRef (for validation reset)
		this.sememeFormRef.resetForm();
		this.sememeForm.reset();
		this.specificsForm.reset();
		// reset the SynGroup ctrl and form
		this.synGroupFormRef.resetForm();
		this.synGroupCtrl.reset();
		this.synGroupForm.reset();
	}

	public disableSelection() : boolean
	{
		return !this.sememes || this.sememes.length == 0;
	}
}