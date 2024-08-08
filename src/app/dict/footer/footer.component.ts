// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'dict-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, RouterLink, RoutingPipe]
})
export class FooterComponent {
	constructor(
		public transloco: TranslocoService,
	) { }
}
