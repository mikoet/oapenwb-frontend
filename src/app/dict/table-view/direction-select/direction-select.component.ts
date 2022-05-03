// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { Direction } from '@app/_models/dict-api';
import { SearchService } from '@app/_services/search.service';

@Component({
	selector: 'app-direction-select',
	templateUrl: './direction-select.component.html',
	styleUrls: ['./direction-select.component.scss']
})
export class DirectionSelectComponent implements OnInit
{
	constructor(public search: SearchService)
	{
	}

	ngOnInit(): void
	{
	}

	choose(value: Direction): void
	{
		this.search.direction = value;
	}
}
