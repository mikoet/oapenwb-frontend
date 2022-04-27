// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
	selector: '[disableControl]'
})
export class DisableControlDirective
{
	@Input() set disableControl(condition: boolean)
	{
		const action = condition ? 'disable' : 'enable';
		// TODO there is an error here: when LangPair component is freshly opened, see console
		if (this.ngControl?.control) {
			this.ngControl?.control[action]({ onlySelf: true });
		}
	}

	constructor(private ngControl: NgControl)
	{
	}
}