// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { DEFAULT_UI_LOCALE } from '@app/_config/config';
import { LemmaService } from '@app/_services/lemma.service';
import { SearchService } from '@app/_services/search.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

@Component({
    selector: 'dict-result-table',
    templateUrl: './result-table.component.html',
    styleUrls: ['./result-table.component.scss'],
    standalone: true,
    imports: [NgIf, NgFor, TranslocoDirective, AsyncPipe]
})
export class ResultTableComponent implements OnInit
{
	DEFAULT_UI_LOCALE = DEFAULT_UI_LOCALE;

	constructor(
		public search: SearchService,
		public lemma: LemmaService,
	) {
	}

	ngOnInit(): void
	{
	}
}
