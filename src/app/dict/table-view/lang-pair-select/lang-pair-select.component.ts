// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { LANG_PAIRS, SearchService } from '@app/_services/search.service';

@Component({
	selector: 'app-lang-pair-select',
	templateUrl: './lang-pair-select.component.html',
	styleUrls: ['./lang-pair-select.component.scss']
})
export class LangPairSelectComponent
{
	langPairs = LANG_PAIRS;

	constructor(
		public search: SearchService,
	) {
	}

	choose(id: string) : void {
		this.search.pair = id;
	}
}
