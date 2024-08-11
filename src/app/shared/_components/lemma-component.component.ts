// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { Component, Input } from '@angular/core'

@Component({
	selector: 'lemma',
	template: `
		<div [innerHTML]="content"></div>
	`,
	styles: ``,
	providers: [],
	standalone: true,
})
export class LemmaComponentComponent {
	@Input()
	content: string = ''
}
