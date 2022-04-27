// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Input } from '@angular/core';

/**
 * To use this directive put the attribut '[disableForm]="isDisabled"' into an html tag.
 */
@Component({
	selector: '[disableForm]',
	styles: [`
	  fieldset {
		display: block;
		margin: unset;
		padding: unset;
		border: unset;
	  }
	`],
	template: `
	  <fieldset [disabled]="disableForm">
		<ng-content></ng-content>
	  </fieldset>
	`
})
export class DisableFormComponent {
	@Input('disableForm') disableForm: boolean;
	constructor() { }
}
