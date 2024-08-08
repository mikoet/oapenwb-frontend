// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'lemma',
    templateUrl: './lemma-component.component.html',
    styleUrls: ['./lemma-component.component.scss'],
    providers: [],
    standalone: true
})
export class LemmaComponentComponent implements OnInit {
	@Input()
	content: string = ''

	constructor()
	{ }

	ngOnInit() : void
	{
	}
}