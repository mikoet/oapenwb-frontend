// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component } from '@angular/core';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { RouterLink } from '@angular/router';
import { MatCard } from '@angular/material/card';

@Component({
    selector: 'simple-card-form',
    templateUrl: './simple-card-form.component.html',
    styleUrls: ['./simple-card-form.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, MatCard, RouterLink, RoutingPipe]
})
export class SimpleCardFormComponent
{
	constructor(
		public transloco: TranslocoService,
	) { }
}
