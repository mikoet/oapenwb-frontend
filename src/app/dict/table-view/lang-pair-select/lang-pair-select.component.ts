// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { SearchService } from '@app/_services/search.service';

@Component({
	selector: 'app-lang-pair-select',
	templateUrl: './lang-pair-select.component.html',
	styleUrls: ['./lang-pair-select.component.scss']
})
export class LangPairSelectComponent implements OnInit
{
	constructor(public search: SearchService)
	{
	}

	ngOnInit(): void
	{
	}

	choose(id: string) : void
	{
		this.search.pair = id;
	}
}
