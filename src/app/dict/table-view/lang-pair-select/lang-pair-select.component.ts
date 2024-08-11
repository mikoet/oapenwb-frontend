// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { LANG_PAIRS, SearchService } from '@app/_services/search.service';
import { MatDivider } from '@angular/material/divider';
import { NgFor, NgIf } from '@angular/common';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-lang-pair-select',
    templateUrl: './lang-pair-select.component.html',
    styleUrls: ['./lang-pair-select.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, MatButton, MatTooltip, MatMenuTrigger, MatMenu, NgFor, NgIf, MatMenuItem, MatDivider]
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
