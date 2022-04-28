// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-lang-pair-select',
	templateUrl: './lang-pair-select.component.html',
	styleUrls: ['./lang-pair-select.component.scss']
})
export class LangPairSelectComponent implements OnInit
{
	activeLangPair: string = 'nds-en';

	constructor()
	{
	}

	ngOnInit(): void
	{
	}

	choose(id: string) : void
	{
		this.activeLangPair = id;
	}
}
