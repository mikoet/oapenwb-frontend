// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { AbstractControl, FormArray, FormGroup } from "@angular/forms";

export function countErrors(formGroup: FormGroup|FormArray) : number
{
	let errorCount = 0;
	for (let controlKey in formGroup.controls) {
		if (formGroup.controls.hasOwnProperty(controlKey)) {
			if (formGroup.controls[controlKey].errors) {
				// it's enough to count one error per FormControl
				errorCount += 1; //Object.keys(formGroup.controls[controlKey].errors).length;
			}
		}
	}
	return errorCount;
}

export function doEnablingControl(control: AbstractControl, disable: boolean) : void
{
	if (control) {
		const action = disable ? 'disable' : 'enable';
		control[action]({ onlySelf: true });
	}
}

/**
 * Transfers each attribute that exists on target from source to target
 * (if source has that attribute, too).
 * 
 * @param source 
 * @param target 
 */
export function transferValues(source: Object, target: Object) : void
{
	if (!!source && !!target) {
		Object.keys(target).forEach(key => {
			if (source[key] !== undefined) {
				target[key] = source[key];
			}
		});
	}
}
