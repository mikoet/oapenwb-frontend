// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'dict-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, RouterLink, NgClass, MatMenuTrigger, FontAwesomeModule, MatMenu, MatMenuItem, RoutingPipe]
})
export class HeaderComponent implements OnInit {
	faLanguage = faLanguage;
	hideMenu: boolean = true;

	constructor(
		public transloco: TranslocoService,
	) { }

	ngOnInit(): void {
	}

	toggleMenu(): void {
		this.hideMenu = !this.hideMenu;
	}
}
