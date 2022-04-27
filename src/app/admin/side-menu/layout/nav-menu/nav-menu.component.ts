// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Input } from '@angular/core';
import { CurrentNode, NavigationNode } from '@app/admin/navigation/navigation.service';

@Component({
	selector: 'app-nav-menu',
	templateUrl: './nav-menu.component.html',
	styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent
{
	@Input() currentNode: CurrentNode | undefined;
	@Input() isWide = false;
	@Input() nodes: NavigationNode[];
	get filteredNodes() { return this.nodes ? this.nodes.filter(n => !n.hidden) : []; }
}