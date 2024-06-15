// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, isDevMode, EventEmitter, Output } from '@angular/core';
import { FormGroup, Validators, FormGroupDirective, FormControl } from '@angular/forms';
import { MatLegacySelectChange as MatSelectChange } from '@angular/material/legacy-select';
import { LexemeForm, Variant, LemmaTemplate, Orthography, Lemma, MetaInfo } from '@app/admin/_models/admin-api';
import { DataService, ExtLanguage } from '@app/admin/_services/data.service';
import { LexemeOrigin, LexemeService } from '@app/admin/_services/lexeme.service';
import { Subscription } from 'rxjs';
import { TransferStop } from '../view/view.component';
import { LexemeFormsComponent } from '../lexeme-forms/lexeme-forms.component';
import { TranslocoService } from '@ngneat/transloco';
import { ApiAction } from '@app/admin/_models/enums';
import { countErrors, doEnablingControl } from '@app/admin/_util/form-utils';
import { VariantSupply } from './variantSupply';
import { SHOW_CHANGE_DATA } from '../editor/editor.component';
import { DialectsSelectComponent } from '@app/admin/_components/dialects-select/dialects-select.component';

export class Dialect
{
	id: number;
	localName: string;
	uitID: string;
	mainOrthographyID: number;
	level: number;
}

@Component({
	selector: 'lex-tab-variants',
	templateUrl: './tab-variants.component.html',
	styleUrls: ['./tab-variants.component.scss']
})
export class TabVariantsComponent implements OnInit, OnDestroy, VariantSupply
{
	public readonly isDevMode: boolean = isDevMode();
	public readonly showChangeData = SHOW_CHANGE_DATA;

	// Formular: top form
	readonly variantsForm = new FormGroup({
		id: new FormControl<number|null>({ value: null, disabled: true }),
		dialectIDs: new FormControl<number[]|null>(null),
		orthographyID: new FormControl<number|null>(null, Validators.required),
		metaInfos: new FormControl<MetaInfo[]|null>(null),
		active: new FormControl(true, Validators.required),
	});
	@ViewChild(FormGroupDirective)
	variantsFormRef: FormGroupDirective;

	// Formular: lemma form
	lemmaForm = new FormGroup({
		fillLemma: new FormControl<number>(null, Validators.required),
		pre: new FormControl<string|null>(null),
		main: new FormControl<string|null>(null, Validators.required),
		post: new FormControl<string|null>(null),
		also: new FormControl<string|null>(null),
	});
	@ViewChild(FormGroupDirective)
	lemmaFormRef: FormGroupDirective; // Bruke ik dår meyr as eyn?

	// Component: dialects select
	@ViewChild('dialectsSelect')
	private dialectsSelect: DialectsSelectComponent;

	// Component: lexeme forms
	private _lexemeForms: LexemeFormsComponent = null;
	get lexemeForms() {
		return this._lexemeForms;
	}
	@ViewChild('lexemeForms', { static: false })
	set lexemeForms(component: LexemeFormsComponent)
	{
		if (component) {
			if (this.lexemeForms !== component) {
				if (this.lexemeFormsChangeSubscription) {
					this.lexemeFormsChangeSubscription.unsubscribe();
					this.lexemeFormsChangeSubscription = null;
				}
				this._trackChanges = false;
				this._lexemeForms = component;
				this.lexemeForms.basedOnType = this._basedOnType;
				this.lexemeForms.basedOnLanguage = this._basedOnLanguage;
				this.lexemeFormsChangeSubscription =
					this._lexemeForms.lexemeFormsCtrl.valueChanges.subscribe(this.lexemeFormsValueChanges);
				this.setDataOnLexemeForms();
				this.updateVariantName();
				this.doEnabling();
				this.changeDetector.detectChanges();
				this._trackChanges = true; // is this the right time to activate tracking again?
			}
		} else {
			if (this.lexemeFormsChangeSubscription) {
				this.lexemeFormsChangeSubscription.unsubscribe();
				this.lexemeFormsChangeSubscription = null;
			}
			this._lexemeForms = null;
			this.lexemeFormsEC = 0;
		}
	}
	private setDataOnLexemeForms()
	{
		if (this._lexemeForms) {
			this._lexemeForms.basedOnType = this._basedOnType;
			this._lexemeForms.basedOnLanguage = this._basedOnLanguage;
			if (this.selectedVariant >= 0) {
				this.lexemeForms.setData(this._variants[this.selectedVariant].lexemeForms);
			}
		}
	}
	private lexemeFormsValueChanges = (): void => {
		if (this.lexemeForms) {
			this.lexemeFormsEC = countErrors(this.lexemeForms.lexemeFormsCtrl);
			if (this._trackChanges === true) {
				this._changed = true;
				this.updateVariantName();
			}
			this.writeTrackingDataToService();
		} else {
			this.lexemeFormsEC = 0;
		}
	}

	// Error counting
	//@Output() errorChange = new EventEmitter<number>();
	//private _errorChange = new BehaviorSubject<number>(0);
	//public readonly errorChange = this._errorChange.asObservable();

	private _errors: number = 0;
	public get errors() : number { return this._errors; }
	private setErrors(errors: number) : void {
		if (this._errors !== errors) {
			this._errors = errors;
			//this.errorChange.emit(this.errors);
			//this._errorChange.next(this.errors);
		}
	}
	private _variantsEC: number = 0;
	private get variantsEC() : number { return this._variantsEC; }
	private set variantsEC(errors: number) {
		if (this._variantsEC !== errors) {
			this._variantsEC = errors;
			this.setErrors(this.errorCount);
		}
	}
	private _lemmaEC: number = 0;
	private get lemmaEC() : number { return this._lemmaEC; }
	private set lemmaEC(errors: number) {
		if (this._lemmaEC !== errors) {
			this._lemmaEC = errors;
			this.setErrors(this.errorCount);
		}
	}
	private _lexemeFormsEC: number = 0;
	private get lexemeFormsEC() : number { return this._lexemeFormsEC; }
	private set lexemeFormsEC(errors: number) {
		if (this._lexemeFormsEC !== errors) {
			this._lexemeFormsEC = errors;
			this.setErrors(this.errorCount);
		}
	}
	private get errorCount() : number {
		return this.variantsEC + this.lemmaEC + this.lexemeFormsEC;
	}

	// Are changes tracked right now?
	private _trackChanges: boolean = false;
	/*private set trackChanges(value: boolean) {
		this._trackChanges = value;
	}*/
	get trackChanges() : boolean {
		return this._trackChanges;
	}
	// Was the data in this tab changed since last creating, loading or saving?
	private _changed: boolean = false;
	/*private set changed(value: boolean) {
		this._changed = value;
	}*/
	get changed() : boolean {
		return this._changed;
	}
	private _trackErrors: boolean = false;
	public get trackErrors() : boolean {
		return this._trackErrors;
	}

	// Subscriptions
	private variantsChangeSubscription: Subscription;
	private lemmaChangeSubscription: Subscription;
	private lexemeFormsChangeSubscription: Subscription;

	// Type data
	private _basedOnType: number; // will be set throuw the editor
    public set basedOnType(lexemeTypeID: number) {
		if (this._basedOnType && this._basedOnType !== lexemeTypeID) {
			// Reset the lexeme forms for all variants
			this.resetLexemeForms();
			this.updateVariantName();
		}
		this._basedOnType = lexemeTypeID;
		if (this.lexemeForms) {
			this.lexemeForms.basedOnType = lexemeTypeID;
		}
		this.doEnabling();
    }
	private resetLexemeForms() : void
	{
		for (let i = 0; i < this._variants.length; i++) {
			this._variants[i].lexemeForms = [];
			// 1 error is set so the user must review this variant before they can save it
			this._variants[i]['__errorCount'] = 1;
		}
	}

	// Language data
	private _basedOnLanguage: number = null; // will be set throuw the editor
    public set basedOnLanguage(languageID: number) {
		let oldValue = this._basedOnLanguage;
		this._basedOnLanguage = languageID;
		if (oldValue === null && oldValue !== languageID) {
			// basedOnLanguage is set for the first time, but we do not know if it was set
			// automatically in editor#readFromService() or by user interaction
			let orthoCtrl = this.variantsForm.get('orthographyID');
			if (!orthoCtrl.value) {
				// If there is no orthography set yet, set it to the main orthography of the language now
				let language = this.data.store.languages.get(languageID);
				orthoCtrl.setValue(language?.mainOrthographyID);
				this.updateVariantName();
			}
		} else if (oldValue !== null && oldValue !== languageID) {
			// Language is changed from one to another, also change the orthography
			let orthoCtrl = this.variantsForm.get('orthographyID');
			let language = this.data.store.languages.get(languageID);
			orthoCtrl.setValue(language?.mainOrthographyID);
			this.updateVariantName();
		}
		if (this.lexemeForms) {
			this.lexemeForms.basedOnLanguage = languageID;
		}
		this.doEnabling();
    }
	public get basedOnLanguage() : number {
		return this._basedOnLanguage;
	}

	editMode: boolean = false;
	// the variants once they are set
	_variants: Variant[] = [];
	public get variants() {
		return this._variants;
	}
	_variantNames: string[] = [];
	public get variantNames() {
		return this._variantNames;
	}
	selectedVariant: number = 0;
	variantCompare = (o1: any, o2: any) => o1 == o2;

	@Output() private _addedEmitter = new EventEmitter<Variant>();
	get addedEmitter(): EventEmitter<Variant> {
		return this._addedEmitter;
	}
	@Output() private _removedEmitter = new EventEmitter<Variant>();
	get removedEmitter(): EventEmitter<Variant> {
		return this._removedEmitter;
	}

	// Compare function for the fill lemma property
	fillLemmaCompare = (o1: any, o2: any) => o1 == o2;

	constructor(
		private readonly changeDetector: ChangeDetectorRef,
		private readonly transloco: TranslocoService,
		private readonly lexemeService: LexemeService,
		public readonly data: DataService,
	) { }
	
	ngOnInit(): void
	{
		this.variantsChangeSubscription = this.variantsForm.valueChanges.subscribe(() => {
			this.variantsEC = countErrors(this.variantsForm);
			if (this._trackChanges === true) {
				this._changed = true;
			}
			this.writeTrackingDataToService();
		});
		this.lemmaChangeSubscription = this.lemmaForm.valueChanges.subscribe(this.updateLemmaChanges);
		// the third subscription on the lexemeForms is located in the setter of that component

		// initial enabling/disabling
		this.doEnabling();
	}
	private updateLemmaChanges = (): void => {
		this.lemmaEC = countErrors(this.lemmaForm);
		if (this._trackChanges === true) {
			this._changed = true;
		}
		this.writeTrackingDataToService();
	}

	ngOnDestroy(): void
	{
		this.variantsChangeSubscription.unsubscribe();
		this.lemmaChangeSubscription.unsubscribe();
		if (this.lexemeFormsChangeSubscription) {
			this.lexemeFormsChangeSubscription.unsubscribe();
		}
	}

	readFromService(typeID: number, langID: number, variants: Variant[]) : void
	{
		this._trackChanges = false;
		this._trackErrors = false;

		// Reset this component
		this.resetComponent();

		this.editMode = this.lexemeService.store.active?.origin === LexemeOrigin.TopList;
		this._variantNames = new Array(variants.length).fill(null);
		this._variants = variants ? variants : [];

		this.basedOnType = typeID;
		this.basedOnLanguage = langID;
		this.activateVariant(this.selectedVariant);
		// Enabling tracking is done in activateVariant()

		// Build the variant namens
		for (let i = 0; i < this._variantNames.length; i++) {
			this._variantNames[i] = this.buildVariantName(i);
		}
	}

	writeToService(doValidation: boolean) : TransferStop[]
	{
		this._trackChanges = false;
		this._trackErrors = false;
		let active = this.lexemeService.store.active;
		// writing back only for TopList lexemes
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			if (doValidation && !this.variantsForm.valid) {
				let stop = new TransferStop();
				let formsStops: TransferStop[] = [];
				if (this._lexemeForms) {
					formsStops = this._lexemeForms.getData(doValidation, []);
				}
				stop.uitID = 'admin:err.tabVariantsInvalid';
				return [stop, ...formsStops];
			}
			this.storeActiveVariant();
		}
		return [];
	}

	private writeTrackingDataToService() : void
	{
		let active = this.lexemeService.store.active;
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			if (this._trackChanges && this._changed === true) {
				let activeVariant = this._variants[this.selectedVariant];
				activeVariant.changed = true;
				if (activeVariant.apiAction == ApiAction.None) {
					activeVariant.apiAction = ApiAction.Update;
				}
			}
			if (this._trackErrors) {
				// Attributes starting with __ are special in that they'll be removed before sending the data to the backend
				this._variants[this.selectedVariant]['__errorCount'] = this.errors;
			}
			if (this.trackChanges || this.trackErrors) {
				// Right now all we can do is write back all variants to the lexemeService.
				// But we do not update all values, though. That's done only in storeActiveVariant().
				this.lexemeService.writeToActiveLexeme('variants', this._variants, true);
			}
		} else {
			this.variantsEC = 0;
			this.lemmaEC = 0;
			this.lexemeFormsEC = 0;
			this._changed = false;
		}
	}

	private storeActiveVariant() : void
	{
		this._trackChanges = false;
		let active = this.lexemeService.store.active;
		// writing back only for TopList lexemes
		if (active !== null && active.origin === LexemeOrigin.TopList) {
			let variantValues = this.variantsForm.getRawValue();
			let lemmaValues = this.lemmaForm.getRawValue();
			// Receive lexeme forms
			let lexemeForms: LexemeForm[] = [];
			if (this._lexemeForms) {
				this._lexemeForms.getData(false, lexemeForms);
			}

			// Nested groups / form arrays must be assigned seperately (seems to be a bug: https://github.com/angular/angular/issues/12963)
			// TODO write automated test for this to see if it gets fixed in future releases
			//values.tags = this.tagsControls.value;
			//this.lexemeService.writeToActiveLexeme('lexeme', values);

			// Copy all formular data into the active variant
			let source = Object.assign({}, variantValues, { lemma: lemmaValues }, { lexemeForms: lexemeForms });
			let target = this._variants[this.selectedVariant];
			// Check if the desired section exists as target
			if (target !== null && target !== undefined) {
				Object.keys(target).forEach(key => {
					if (source[key] !== undefined) {
						target[key] = source[key];
					}
				});
				this._variants[this.selectedVariant] = target;
				// Write - actually - all variants back to the active lexeme
				this.lexemeService.writeToActiveLexeme('variants', this._variants);
			}
			// Update the variant's name
			this.updateVariantName();
		}
	}

	variantSelected(event: MatSelectChange) : void
	{
		this.activateVariant(event.value);
	}

	canAddVariant() : boolean
	{
		let result = false;
		if (this._basedOnType && this._basedOnLanguage && this.editMode) {
			result = true;
		}
		return result;
	}

	canRemoveVariant() : boolean
	{
		return this.canAddVariant() && (this._variants != null && this._variants.length > 1);
	}

	addVariant() : void
	{
		// Store the active variant
		this.storeActiveVariant();
		// Create a new variant
		let variant = this.lexemeService.createVariant(false);
		if (this._basedOnLanguage) {
			// Set default orthography
			let language = this.data.store.languages.get(this._basedOnLanguage);
			variant.orthographyID = (language?.mainOrthographyID);
		}
		// Add the new variant to internal structures
		this._variantNames.push('–');
		this._variants.push(variant);
		let index = this._variants.length - 1;
		this._variantNames[index] = this.buildVariantName(index);
		this.activateVariant(index);
		// Publish the new variant
		this._addedEmitter.emit(variant);
	}

	removeVariant() : void
	{
		if (this.selectedVariant >= 0 && this.selectedVariant < this._variants.length) {
			if (this._variants[this.selectedVariant].apiAction == ApiAction.Insert) {
				// Keep the index of the variant to remove
				let oldIndex = this.selectedVariant;
				let variant = this._variants[oldIndex];
				// Change to the base variant so the UI will not try to show a removed variant
				this.activateVariant(0);
				// Completely remove the variant from the two arrays since it was newly created and is
				// unknown to the backend.
				this._variants.splice(oldIndex, 1);
				this._variantNames.splice(oldIndex, 1);
				// Emit the removed variant
				this._removedEmitter.emit(variant);
			} else {
				let variant = this._variants[this.selectedVariant];
				// For other variants that were already known to the backend the apiAction will be set to Delete
				variant.apiAction = ApiAction.Delete;
				this.activateVariant(0);
				// Emit the removed variant
				this._removedEmitter.emit(variant);
			}
		}
	}

	updateVariantName(index: number = null) : void
	{
		let forms: LexemeForm[] = [];
		if (!!this._lexemeForms) {
			this._lexemeForms.getData(false, forms);
		}
		if (!index) {
			index = this.selectedVariant;
		}
		let variant = this._variants[index];
		let name = this.buildVariantNameWithGivenForms(index, variant?.lemma, forms);
		if (name && name !== this._variantNames[index]) {
			this._variantNames[index] = name;
			this.changeDetector.detectChanges();
		}
	}

	buildVariantName(index: number) : string
	{
		let variant = this._variants[index];
		return this.buildVariantNameWithGivenForms(index, variant?.lemma, variant?.lexemeForms);
	}

	buildVariantNameWithGivenForms(index: number, lemma: Lemma, lexemeForms: LexemeForm[]) : string
	{
		if (index >= this._variants.length) {
			return '– ERR –';
		}

		let variant = this._variants[index];
		let baseForm = '–';
		if (!!lemma && !!lemma.main) {
			// If the lemma is already set then take the lemma
			if (!!lemma.pre) {
				baseForm = lemma.pre + ' ';
			} else {
				baseForm = '– ';
			}
			baseForm += lemma.main;
			if (!!lemma.post) {
				baseForm += ' ' + lemma.post;
			} else {
				baseForm += ' –';
			}
		} else if (lexemeForms) {
			// Find the first set text for a lexeme form of the main lexeme
			for (let form of lexemeForms) {
				if (form && form.text) {
					baseForm = form.text;
					break;
				}
			}
		}
		let orthography = '–';
		let orthographyID = index == this.selectedVariant
			? this.variantsForm.get('orthographyID').value
			: variant?.orthographyID;
		if (!!orthographyID) {
			orthography = this.data.store.orthographies.get(orthographyID)?.abbreviation;
		}

		let dialects = '–';
		let dialectIDs = index == this.selectedVariant
			? this.variantsForm.get('dialectIDs').value
			: variant?.dialectIDs;
		if (!!dialectIDs) {
			dialects = '';
			let first: boolean = true;
			for (let dialectID of dialectIDs) {
				if (!first) {
					dialects += '/';
				}
				let name = this.transloco.translate('abbr.' + this.dialect_uitID_abbr(dialectID));
				dialects += name ? name : 'ERR';
				first = false;
			}
		}

		let name = baseForm + ' | ' + orthography + ' | ' + dialects;
		if (index == 0) {
			name += ' [';
			name += this.transloco.translate('admin.mainVariant');
			name += ']';
		}
		return name;
	}

	private dialect_uitID_abbr(dialectID: number) : string
	{
		let dialect = this.data.store.allLanguages?.get(dialectID);
		if (!!dialect) {
			return dialect.uitID_abbr;
		}
		return 'ERR' + dialectID;
	}

	getOrthographies() : Orthography[]
	{
		if (this._basedOnLanguage) {
			return this.data.store.languages?.get(this._basedOnLanguage)?._orthographies;
		}
		return [];
	}

	fillLemmaSelected(event: MatSelectChange) : void
	{
		this.doEnablingLemma();
		this.updateLemmaChanges();
	}

	private lemmaTemplates: LemmaTemplate[] = null;
	getTemplates() : LemmaTemplate[]
	{
		if (!this._basedOnType || !this._basedOnLanguage) {
			return [];
		}
		if (this.lemmaTemplates === null) {
			let result: LemmaTemplate[] = [];
			for (let template of this.data.store.lemmaTemplates.values) {
				// TODO Also filter by dialects?
				if (template.lexemeTypeID === this._basedOnType
					&& template.langID === this._basedOnLanguage)
				{
					result.push(template);
				}
			}
			this.lemmaTemplates = result;
		}
		return this.lemmaTemplates;
	}

	getTemplateString(template: LemmaTemplate) : string
	{
		if (template) {
			let result = template.name ? template.name : '–';
			result += ' (';
			// Add type
			if (template.lexemeTypeID) {
				result += this.data.store.lexemeTypes.get(template.lexemeTypeID).name + ', ';
			} else {
				result += '–, ';
			}
			// Add language
			if (template.langID) {
				result += this.data.store.languages.get(template.langID).locale + ', ';
			} else {
				result += '–, ';
			}
			// Add orthography
			if (template.orthographyID) {
				result += this.data.store.orthographies.get(template.orthographyID).abbreviation;
			} else {
				result += '–';
			}
			result += ')';
			return result;
		}
		return '';
	}

	isTypeAndLanguageSet() : boolean
	{
		let result = false;
		if (this._basedOnType && this._basedOnLanguage) {
			result = true;
		}
		return result;
	}

	private activateVariant(index: number)
	{
		this._trackChanges = false;
		this._trackErrors = false;
		if (this.selectedVariant != index) {
			// store the currently active variant when there is a selection change
			this.storeActiveVariant();
			this.resetForms();
		}
		// The actual activation of mainVariant or else another variant
		if (index < 0 || index >= this._variants.length) {
			index = 0;
		}
		// activate 
		this.selectedVariant = index;
		let variant = this._variants[index];
		if (variant) {
			// patch the values of the variant into the forms
			this._trackErrors = true;
			this.variantsForm.patchValue(variant);
			this.lemmaForm.patchValue(variant.lemma);
			this.setDataOnLexemeForms();
			this._changed = variant.changed;
		}
		this._trackErrors = true;
		this.doEnabling();
		this._trackChanges = true;
	}

	private doEnabling() : void
	{
		let baseConfigSet = this._basedOnType && this._basedOnLanguage;
		if (this.lexemeService.store.active?.origin === LexemeOrigin.TopList && baseConfigSet) {
			// only active when type and language are set on the general form
			this.doEnablingVariants();
			this.doEnablingLemma();
			if (this.lexemeForms) {
				this.lexemeForms.doEnabling();
			}
		} else {
			this.variantsForm.disable({ emitEvent: false });
			//this.tagCtrl.disable();
			this.lemmaForm.disable({ emitEvent: false });
			if (this.lexemeForms) {
				this.lexemeForms.disable();
			}
		}
	}

	private doEnablingVariants() : void
	{
		this.variantsForm.enable({ emitEvent: false });
		this.variantsForm.markAllAsTouched();

		doEnablingControl(this.variantsForm.controls['dialectIDs'], !this.dialectsSelect.hasItems());
	}

	private doEnablingLemma() : void
	{
		let fillLemma = this.lemmaForm.get('fillLemma')?.value;
		if (fillLemma == -2 || fillLemma > 0) {
			this.lemmaForm.disable();
			this.lemmaForm.get('fillLemma').enable({ emitEvent: false });
		} else {
			this.lemmaForm.enable({ emitEvent: false });
			this.lemmaForm.markAllAsTouched();
		}
	}

	public resetComponent() : void
	{
		this.editMode = false;
		this._changed = false;
		// Reset the selected variant
		this.selectedVariant = 0;
		// Reset type, language and dialect cache variables
		this._variants = [];
		this._variantNames = [];
		this._basedOnType = null;
		this._basedOnLanguage = null;
		this.resetForms();
		this.doEnabling();
		// TODO 002
		this.changeDetector.detectChanges();
	}

	private resetForms() : void
	{
		this._trackChanges = false;
		// Reset the lemma template array
		this.lemmaTemplates = null;
		// reset the variants form and the formRef (for validation reset)
		this.variantsFormRef.resetForm();
		this.variantsForm.reset();
		// reset the lemma form and the formRef (for validation reset)
		this.lemmaFormRef.resetForm();
		this.lemmaForm.reset();
		// reset the lexeme forms
		if (this.lexemeForms) {
			this.lexemeForms.resetComponent();
		}
	}

	public disableSelection() : boolean
	{
		return !this.variants || this.variants.length == 0;
	}
}