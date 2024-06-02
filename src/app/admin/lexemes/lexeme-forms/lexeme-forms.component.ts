// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import {
	Component,
	OnDestroy,
	OnInit,
	ViewChild,
} from '@angular/core';
import {
	FormArray,
	FormControl,
	FormGroup,
	FormGroupDirective,
	Validators,
} from '@angular/forms';
import { LexemeFormType, LexemeForm } from '@app/admin/_models/admin-api';
import { DataService } from '@app/admin/_services/data.service';
import { NumericKeyMap } from '@app/util/hashmap';
import { TransferStop } from '../view/view.component';

interface PositionedForm
{
	index: number;
	position: number;
	form: LexemeForm;
	formType: LexemeFormType
}

@Component({
	selector: 'lexeme-forms',
	templateUrl: './lexeme-forms.component.html',
	styleUrls: ['./lexeme-forms.component.scss']
})
export class LexemeFormsComponent implements OnInit, OnDestroy
{
	// Formular: word forms form
	formGroup = new FormGroup({
		lexemeForms: new FormArray<FormControl<string>>([] /* , Validators.required */),
	}, {
		updateOn: 'blur',
	});
	@ViewChild(FormGroupDirective) formRef: FormGroupDirective;
	get lexemeFormsCtrl(): FormArray<FormControl<string>> {
		return this.formGroup.controls.lexemeForms;
	}

	// Type data
	private _basedOnType: number; // will be set throuw the editor
    public set basedOnType(lexemeTypeID: number) {
		if (this._basedOnType !== lexemeTypeID) {
			this._basedOnType = lexemeTypeID;
			this.adapt(false);
			this.doEnabling();
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
			/*let orthoCtrl = this.variantsForm.get('orthographyID');
			if (!orthoCtrl.value) {
				// If there is no orthography set yet, set it to the main orthography of the language now
			}*/
			this.adapt(false);
		} else if (oldValue !== null && oldValue !== languageID) {
			// Language is changed from one to another, also change the orthography
			let typeLangConfig = this.data.store.typeLangConfigs.get(this._basedOnType)?.get(this._basedOnLanguage);
			// Check if there is a typeLangConfig, and if so, adapt this component but keep data
			this.adapt(typeLangConfig ? false : true);
		}
		this.doEnabling();
    }

	constructor(
		private data: DataService,
	) { }

	setData(lexemeForms: LexemeForm[]) : void
	{
		this.formTypeIdToForm = new NumericKeyMap();
		for (let form of lexemeForms) {
			this.formTypeIdToForm.add(form.formTypeID, form);
		}
		this.adapt(true);
	}

	/**
	 * 
	 * @param doValidation 
	 * @param data 
	 * @returns 
	 */
	getData(doValidation: boolean, data: LexemeForm[]) : TransferStop[]
	{
		let stops: TransferStop[] = [];
		if (doValidation) {
			// TODO Prüfe alle mandatory LexemeForms
		}
		if (this.indexToFormType.size() > 0) {
			let index = 0;
			for (let control of this.lexemeFormsCtrl.controls) {
				if (control.value) {
					let formType = this.indexToFormType.get(index);
					let form: LexemeForm = {
						variantID: null,
						formTypeID: formType?.id,
						state: 1, // TODO positionedForms[someOtherIndex].form?.state
						text: control.value
					};
					data.push(form);
				}
				index++;
			}
		}
		return stops;
	}

	ngOnInit() : void
	{
	}

	ngOnDestroy() : void
	{
	}

	// TODO fill when read is performed
	private formTypeIdToForm: NumericKeyMap<LexemeForm> = new NumericKeyMap();


	// --- Structural data - begin ---

	private indexToFormType: NumericKeyMap<LexemeFormType> = new NumericKeyMap();
	// Array that will contain the data in the order of the positions of the typeLangConfig or LexemeFormTypes
	positionedForms: PositionedForm[] = [];

	// --- Structural data - end ---

	private adapt(keepData: boolean) : void
	{
		if (!this._basedOnType || !this._basedOnLanguage) {
			return;
		}

		if (!keepData) {
			// reset all data
			this.formTypeIdToForm = new NumericKeyMap();
		}

		// Reset structural data
		this.indexToFormType = new NumericKeyMap();
		this.positionedForms = [];
		this.lexemeFormsCtrl.clear(); // TODO HWA villicht vorswind de feyler (cannot access ... path ...) sünder event. Man het dat noch ander neavenwark?
		this.lexemeFormsCtrl.reset(); // { emitEvent: false }

		// Quick access to LexemeFormTypes
		let formTypes = this.data.store.lexemeFormTypes.get(this._basedOnType);

		// (re)create the lexemeForms array and the iteratable array for the UI
		let typeLangConfig = this.data.store.typeLangConfigs.get(this._basedOnType)?.get(this._basedOnLanguage);
		if (typeLangConfig) {
			// Build structural data according to the typeLangConfig
			let index = 0;
			let position = 0;
			for (let formTypePos of typeLangConfig.formTypePositions) {
				if (formTypePos) {
					// If the formTypePos is not null retrieve the formType for it
					let formType = formTypes.get(formTypePos.formTypeID);
					if (formType) {
						// If the formType exists then create a FormControl for it.
						// Usually it has to exist. But it can happen that a LexemeFormType gets deleted
						// but remains in the TypeLangConfig without thinking about it. That's what the check is for.
						this.createControl(formType, index, position);
						index++;
					} else {
						console.warn('Form type with ID %i does not exist but is referenced in TL config for LT %i and language %i',
							formTypePos?.formTypeID, typeLangConfig?.lexemeTypeID, typeLangConfig?.langID);
					}
				} else {
					this.positionedForms.push(null);
				}
				position++;
			}
		} else {
			// Build structural data according to the LexemeFormType's positions
			let index = 0;
			let position = 0;
			// the formTypes.values should be ordered by position
			for (let formType of formTypes?.values) {
				this.createControl(formType, index, position);
				index++;
				position++;
			}
		}
	}

	public static adaptToTypeAndLanguage() : void
	{
		
	}

	private createControl(formType: LexemeFormType, index: number, position: number) : void
	{
		let form = this.formTypeIdToForm.get(formType.id);
		let initialValue: string = undefined;
		let disabled: boolean = false;
		if (form) {
			initialValue = form.text;
			disabled = form.state === 4 ? true : false; // 4 === STATE_GENERATED_PROTECTED
		}
		let control: FormControl<string>;
		if (formType.mandatory) {
			control = new FormControl<string>({ value: initialValue, disabled: disabled }, Validators.required);
		} else {
			control = new FormControl<string>({ value: initialValue, disabled: disabled });
		}

		this.lexemeFormsCtrl.push(control);
		this.positionedForms.push({ index: index, position: position, form: form, formType: formType });
		this.indexToFormType.add(index, formType);
	}

	doEnabling() : void
	{
		if (this._basedOnType && this._basedOnLanguage) {
			this.formGroup.enable({ emitEvent: false });
			this.formGroup.markAllAsTouched();

			this.lexemeFormsCtrl.enable({ emitEvent: false });
			this.lexemeFormsCtrl.markAllAsTouched();
		}
	}

	disable() : void
	{
		this.formGroup.disable({ emitEvent: false });
		this.lexemeFormsCtrl.disable({ emitEvent: false });
	}

	resetComponent(): void
	{
		//this._trackChanges = false;
		this.formRef.resetForm();
		this.formGroup.reset();
	}
}