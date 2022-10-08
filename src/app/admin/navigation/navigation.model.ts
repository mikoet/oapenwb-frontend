// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { RouteDesc } from "@app/shared/_helpers/route-desc";

/**
 * The code of this file was originally taken from the Angular documentation project (aio)
 * and then modified to needs of this dictionary. Original file:
 * https://github.com/angular/angular/blob/a2d2a5d5723196117c76b7c00449ccb518414020/aio/src/app/navigation/navigation.model.ts
 * 
 * License: The MIT License
 * Copyright (c) 2010-2019 Google LLC. http://angular.io/license
 */

// Pulled all interfaces out of `navigation.service.ts` because of this:
// https://github.com/angular/angular-cli/issues/2034
// Then re-export them from `navigation.service.ts`

export interface NavigationNode
{
	// NOTE:
	// A navigation node should always have a uitID (to display to the user).
	// It may also have `url` (if it is a leaf node) or `children` (and no `url`), but it should
	// always have `uitID`.
	uitID: string;
	// Roles that are allowed to access the node (if a user has no access to a node it cannot access any of its children)
	roles?: string[];

	targetRoute?: RouteDesc;
	tooltip?: string;
	hidden?: boolean;
	children?: NavigationNode[];
}

export interface NavigationViews
{
	[name: string]: NavigationNode[];
}

/**
 *  Navigation information about a node at specific URL
 *  url: the current URL
 *  view: 'SideNav' | 'TopBar' | 'Footer' | etc
 *  nodes: the current node and its ancestor nodes within that view
 */
export interface CurrentNode
{
	targetRoute: RouteDesc;
	view: string;
	nodes: NavigationNode[];
}

/**
 * A map of current nodes by view.
 * This is needed because some urls map to nodes in more than one view.
 * If a view does not contain a node that matches the current url then the value will be undefined.
 */
export interface CurrentNodes
{
	[view: string]: CurrentNode;
}
