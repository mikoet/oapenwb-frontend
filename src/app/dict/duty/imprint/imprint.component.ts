// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-imprint',
	templateUrl: './imprint.component.html',
	styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit
{
	constructor(
		public readonly transloco: TranslocoService,
	) { }

	ngOnInit(): void {
	}
}
