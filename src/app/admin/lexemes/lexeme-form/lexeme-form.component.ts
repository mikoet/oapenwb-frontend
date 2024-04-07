// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, FormGroupDirective, NgForm, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class MyErrorStateMatcher implements ErrorStateMatcher
{
	public constructor(private mandatory: boolean) {}
	isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean
	{
		//const isSubmitted = form && form.submitted;
		//return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
		if (this.mandatory && control && (!control.value || control.value.length === 0)) {
			return true;
		}
		return false;
	}
}

// When it comes to implementing the interface ControlValueAccessor, this post was of help:
// https://stackoverflow.com/a/62260210/8341158
@Component({
	selector: 'lexeme-form',
	templateUrl: './lexeme-form.component.html',
	styleUrls: ['./lexeme-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => LexemeFormComponent),
			multi: true
		}
	]
})
export class LexemeFormComponent implements OnInit, ControlValueAccessor
{
	input: string = '';
	disabled: boolean = false;
	matcher = null;

	@Input()
	uitID: string = '';

	@Input()
	state: number = 0;

	@Input()
	mandatory: boolean = false;

	constructor() {
	}

	ngOnInit(): void
	{
		this.matcher = new MyErrorStateMatcher(this.mandatory);
	}

	getStateLetter() : string
	{
		switch (this.state) {
			case 1:
				return 'T';
			case 2:
				return 'G';
			case 3:
				return 'O';
			case 4:
				return 'P';
			case 0:
			default:
				return 'E';
		}
	}

	// Code for interface ControlValueAccessor

	onChange: any = () => {}
	onTouch: any = () => {}

	writeValue(input: string): void {
		this.input = input;
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}
}