// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Input, OnChanges } from '@angular/core';
import { NavigationNode } from '@app/admin/navigation/navigation.model';
import { TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-nav-item',
	templateUrl: './nav-item.component.html',
	styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent implements OnChanges {
	@Input() isWide = false;
	@Input() level = 1;
	@Input() node: NavigationNode;
	@Input() isParentExpanded = true;
	@Input() selectedNodes: NavigationNode[] | undefined;

	isExpanded = true
	isSelected = false;
	classes: { [index: string]: boolean };
	nodeChildren: NavigationNode[];

	constructor(
		public readonly transloco: TranslocoService,
	) { }

	ngOnChanges() {
		this.nodeChildren = this.node && this.node.children ? this.node.children.filter(n => !n.hidden) : [];

		if (this.selectedNodes) {
			const ix = this.selectedNodes.indexOf(this.node);
			this.isSelected = ix !== -1; // this node is the selected node or its ancestor
			this.isExpanded = this.isParentExpanded &&
				(this.isSelected || // expand if selected or ...
					// preserve expanded state when display is wide; collapse in mobile.
					(this.isWide && this.isExpanded));
		} else {
			this.isSelected = false;
		}

		this.setClasses();
	}

	setClasses() {
		this.classes = {
			['level-' + this.level]: true,
			collapsed: !this.isExpanded,
			expanded: this.isExpanded,
			selected: this.isSelected
		};
	}

	headerClicked() {
		this.isExpanded = !this.isExpanded;
		this.setClasses();
	}
}