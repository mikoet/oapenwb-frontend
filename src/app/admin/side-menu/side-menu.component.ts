// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit, ViewChild } from '@angular/core';

import { NavigationService } from '@app/admin/navigation/navigation.service';
import { CurrentNodes, NavigationNode } from '@app/admin/navigation/navigation.service';
import { NavMenuComponent } from './layout/nav-menu/nav-menu.component';

@Component({
    selector: 'admin-side-menu',
    templateUrl: './side-menu.component.html',
    styleUrls: ['./side-menu.component.scss'],
    standalone: true,
    imports: [NavMenuComponent]
})
export class SideMenuComponent implements OnInit
{
	currentNodes: CurrentNodes = {};
	sideNavNodes: NavigationNode[];

	/* TODO unused?
	navItems = [
		{key: 'stats', label: 'Statistik'},
		{key: 'stats.visitors', label: '– Besökers'},
		{key: 'stats.searchs', label: '– Söken'},

		{key: 'ui', label: 'Brukersnidstea'},
		{key: 'ui.languages', label: '– Språken'},
		{key: 'ui.translations', label: '– Öäversettings'},
		{key: 'ui.categories', label: '– Kategoryen'},

		{key: 'content', label: 'Inholden'},
		{key: 'content.languages', label: '– Språken & skryvwysen'},
		{key: 'content.langpairs', label: '– Språkpåren'},
		{key: 'content.lexemes', label: '– Leksemen'},
		{key: 'content.categories', label: '– Kategoryen'},
	];*/

	@ViewChild('menulist') menuListRef;

	constructor(private navigationService: NavigationService)
	{
	}

	ngOnInit(): void {
		this.navigationService.currentNodes.subscribe(currentNodes => {
			this.currentNodes = currentNodes;
		});

		this.navigationService.navigationViews.subscribe(views => {
			this.sideNavNodes = views.SideNav || [];
		});
	}

	onSelection(event: any)
	{
	}
}