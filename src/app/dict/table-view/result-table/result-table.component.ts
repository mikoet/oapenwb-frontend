// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { LemmaService } from '@app/_services/lemma.service';
import { SearchService } from '@app/_services/search.service';

@Component({
	selector: 'app-result-table',
	templateUrl: './result-table.component.html',
	styleUrls: ['./result-table.component.scss']
})
export class ResultTableComponent implements OnInit
{
	constructor(
		public search: SearchService,
		public lemma: LemmaService)
	{
	}

	ngOnInit(): void
	{
	}
}
