// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { Direction } from '@app/_models/dict-api';
import { SearchService } from '@app/_services/search.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-direction-select',
    templateUrl: './direction-select.component.html',
    styleUrls: ['./direction-select.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, MatButton, MatTooltip, MatMenuTrigger, MatMenu, MatMenuItem]
})
export class DirectionSelectComponent implements OnInit
{
	constructor(
		public search: SearchService,
	) {
	}

	ngOnInit(): void {
	}

	choose(value: Direction): void {
		this.search.direction = value;
	}
}
