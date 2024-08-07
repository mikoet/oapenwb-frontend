// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'simple-card-form',
  templateUrl: './simple-card-form.component.html',
  styleUrls: ['./simple-card-form.component.scss']
})
export class SimpleCardFormComponent
{
	constructor(
		public transloco: TranslocoService,
	) { }
}
