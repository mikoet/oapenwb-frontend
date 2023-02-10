// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { TranslocoService } from '@ngneat/transloco';

@Component({
	selector: 'dict-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
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
