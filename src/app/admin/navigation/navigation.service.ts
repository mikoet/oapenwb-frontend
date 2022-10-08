// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

import { combineLatest, ConnectableObservable, Observable, of, ReplaySubject } from 'rxjs';
import { map, publishReplay } from 'rxjs/operators';

import {
	ROUTE_ADMIN_ORTHO,
	ROUTE_ADMIN_LANG,
	ROUTE_ADMIN_LANGPAIR,
	ROUTE_ADMIN_LANGORTHOMAPPING,
	ROUTE_ADMIN_LEXEME,
	ROUTE_ADMIN_LEXEMETYPE,
	ROUTE_ADMIN_LEXEMEFORMTYPE,
	ROUTE_ADMIN_UNITLEVEL,
	ROUTE_ADMIN_CATEGORY,
	ROUTE_ADMIN_UILANG,
	ROUTE_ADMIN_UISCOPE,
	ROUTE_ADMIN_UITRANSLATION,
	ROUTE_ADMIN_UIRESULTCATEGORY,
	ROUTE_ADMIN_LEMMATEMPLATE,
	ROUTE_ADMIN_TYPELANGUAGECONFIG
} from '@app/routes';

// Import and re-export the Navigation model types
import { CurrentNodes, NavigationNode, NavigationViews } from './navigation.model';
export { CurrentNodes, CurrentNode, NavigationNode, NavigationViews } from './navigation.model';

@Injectable()
export class NavigationService {
	/**
	 * An observable collection of NavigationNode trees, which can be used to render navigational menus
	 */
	navigationViews: Observable<NavigationViews>;

	/**
	 * An observable of the current node with info about the
	 * node (if any) that matches the current URL location
	 * including its navigation view and its ancestor nodes in that view
	 */
	currentNodes: Observable<CurrentNodes>;

	/* Taken from LocationService */
	private urlSubject = new ReplaySubject<string>(1);
	currentUrl = this.urlSubject.pipe(
		map(url => this.stripSlashes(url)),
	);

	currentPath = this.currentUrl.pipe(
		map(url => {
			// cut out the language
			if (url.indexOf('/') > -1) {
				url = url.substr(url.indexOf('/')+1);
			}
			return (url.match(/[^?#]*/) || [])[0];
		}),  // strip query and hash
		//tap(path => this.gaService.locationChanged(path)),
	);

	private stripSlashes(url: string) {
		return url.replace(/^\/+/, '').replace(/\/+(\?|#|$)/, '$1');
	  }
	/* LocationService end */

	constructor(
		private location: Location,
		private router: Router
	)
	{
		// from LocationService
		this.urlSubject.next(location.path(true));
		this.location.subscribe(state => {
			return this.urlSubject.next(state.url || '');
		});
		// end
		router.events.subscribe((val) => {
			if (val instanceof NavigationEnd) {
				return this.urlSubject.next(val.url || '');
			}
		});

		this.navigationViews = this.fetchNavigationInfo();
		this.currentNodes = this.getCurrentNodes(this.navigationViews);
	}

	/**
	 * Get an observable that fetches the `NavigationResponse` from the server.
	 * We create an observable by calling `http.get` but then publish it to share the result
	 * among multiple subscribers, without triggering new requests.
	 * We use `publishLast` because once the http request is complete the request observable completes.
	 * If you use `publish` here then the completed request observable will cause the subscribed observables to complete too.
	 * We `connect` to the published observable to trigger the request immediately.
	 * We could use `.refCount` here but then if the subscribers went from 1 -> 0 -> 1 then you would get
	 * another request to the server.
	 * We are not storing the subscription from connecting as we do not expect this service to be destroyed.
	 */
	private fetchNavigationInfo(): Observable<NavigationViews> {
		const navigationInfo = of(navigationNodes);
		//(navigationInfo as ConnectableObservable<NavigationViews>).connect();
		return navigationInfo;
	}

	/**
	 * Get an observable of the current nodes (the ones that match the current URL)
	 * We use `publishReplay(1)` because otherwise subscribers will have to wait until the next
	 * URL change before they receive an emission.
	 * See above for discussion of using `connect`.
	 */
	private getCurrentNodes(navigationViews: Observable<NavigationViews>): Observable<CurrentNodes> {
		const currentNodes = combineLatest([
			navigationViews.pipe(
					map(views => {
						let result = this.computeUrlToNavNodesMap(views);
						return result;
					}),
				),
			this.currentPath,
		]).pipe(
			map(([navMap, url]: [Map<string, CurrentNodes>, string]) => ({ navMap: navMap, url: url })),
			map((result: { navMap: Map<string, CurrentNodes>, url: string }) => {
				/*
				const matchSpecialUrls = /^api/.exec(result.url);
				if (matchSpecialUrls) {
					result.url = matchSpecialUrls[0];
				}
				 */
				let url = result.url;
				const lastIndexOfSlash = url.lastIndexOf('/');
				if (lastIndexOfSlash !== -1) {
					url = url.substring(lastIndexOfSlash + 1);
				}
				return result.navMap.get(url) || { '': { view: '', targetRoute: null, nodes: [] } };
			}),
			publishReplay(1));
		(currentNodes as ConnectableObservable<CurrentNodes>).connect();
		return currentNodes;
	}
	
	/**
	 * Compute a mapping from URL to an array of nodes, where the first node in the array
	 * is the one that matches the URL and the rest are the ancestors of that node.
	 *
	 * @param navigation - A collection of navigation nodes that are to be mapped
	 */
	private computeUrlToNavNodesMap(navigation: NavigationViews): Map<string, CurrentNodes> {
		const navMap = new Map<string, CurrentNodes>();
		Object.keys(navigation)
			.forEach(view => navigation[view]
				.forEach(node => this.walkNodes(view, navMap, node)));
		return navMap;
	}

	/**
	 * Add tooltip to node if it doesn't have one and have title.
	 * If don't want tooltip, specify `tooltip: ""` in navigation.json
	 */
	// TODO can this method be removed?
	private ensureHasTooltip(node: NavigationNode) {
		const title = node.uitID;
		const tooltip = node.tooltip;
		if (tooltip == null && title) {
			// add period if no trailing punctuation
			node.tooltip = title + (/[a-zA-Z0-9]$/.test(title) ? '.' : '');
		}
	}

	/**
	 * Walk the nodes of a navigation tree-view,
	 * patching them and computing their ancestor nodes
	 */
	private walkNodes(
		view: string, navMap: Map<string, CurrentNodes>,
		node: NavigationNode, ancestors: NavigationNode[] = []) {
		const nodes = [node, ...ancestors];
		const targetRoute = node.targetRoute;
		//this.ensureHasTooltip(node);

		// only map to this node if it has a url
		if (targetRoute) {
			if (!navMap.has(targetRoute.path)) {
				navMap.set(targetRoute.path, {});
			}
			const navMapItem = navMap.get(targetRoute.path)!;
			navMapItem[view] = { targetRoute, view, nodes };
		}

		if (node.children) {
			node.children.forEach(child => this.walkNodes(view, navMap, child, nodes));
		}
	}
}

let navigationNodes: NavigationViews =
{
	SideNav: [
		{
			uitID: "admin.baseData",
			roles: ['Admin'],
			tooltip: "admin.baseData:tooltip",
			children: [
				{
					targetRoute: ROUTE_ADMIN_ORTHO,
					uitID: "admin.orthographies",
					tooltip: "admin.orthographies:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_LANG,
					uitID: "admin.languages",
					tooltip: "admin.languages:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_LANGPAIR,
					uitID: "admin.langPairs",
					tooltip: "admin.langPairs:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_LANGORTHOMAPPING,
					uitID: "admin.loMappings",
					tooltip: "admin.loMappings:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_LEXEMETYPE,
					uitID: "admin.lexemeTypes",
					tooltip: "admin.lexemeTypes:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_LEXEMEFORMTYPE,
					uitID: "admin.lexemeFormTypes",
					tooltip: "admin.lexemeFormTypes:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_TYPELANGUAGECONFIG,
					uitID: "admin.typeLangConfigs",
					tooltip: "admin.typeLangConfigs:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_LEMMATEMPLATE,
					uitID: "admin.lemmaTemplates",
					tooltip: "admin.lemmaTemplates:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_CATEGORY,
					uitID: "admin.categories",
					tooltip: "admin.categories:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_UNITLEVEL,
					uitID: "admin.unitLevels",
					tooltip: "admin.unitLevels:tp",
				},
			]
		},
		{
			uitID: "admin.contents",
			roles: ['Admin', 'Editor'],
			tooltip: "admin.contents:tp",
			children: [
				{
					targetRoute: ROUTE_ADMIN_LEXEME,
					uitID: "admin.lexemes",
					tooltip: "admin.lexemes:tp",
				},
			]
		},
		/*{
			uitID: "admin.featureData",
			tooltip: "admin.featureData:tp",
			"children": [

			]
		},*/
		{
			uitID: "admin.ui",
			roles: ['Admin'],
			tooltip: "admin.ui:tp",
			children: [
				{
					targetRoute: ROUTE_ADMIN_UILANG,
					uitID: "admin.uiLanguages",
					tooltip: "admin.uiLanguages:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_UISCOPE,
					uitID: "admin.uiScopes",
					tooltip: "admin.uiScopes:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_UITRANSLATION,
					uitID: "admin.uiTranslations",
					tooltip: "admin.uiTranslations:tp",
				},
				{
					targetRoute: ROUTE_ADMIN_UIRESULTCATEGORY,
					uitID: "admin.uiResultCategories",
					tooltip: "admin.uiResultCategories:tp",
				},
			]
		}
	]
};