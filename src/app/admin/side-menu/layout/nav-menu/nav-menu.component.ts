// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Input } from '@angular/core';
import { CurrentNode, NavigationNode } from '@app/admin/navigation/navigation.service';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { NgFor } from '@angular/common';

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    styleUrls: ['./nav-menu.component.scss'],
    standalone: true,
    imports: [NgFor, NavItemComponent]
})
export class NavMenuComponent
{
	@Input() currentNode: CurrentNode | undefined;
	@Input() isWide = false;
	@Input() nodes: NavigationNode[];
	get filteredNodes() { return this.nodes ? this.nodes.filter(n => !n.hidden) : []; }
}