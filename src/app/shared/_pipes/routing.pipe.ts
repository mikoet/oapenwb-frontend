// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco'

import { allRoutesMap } from '@app/shared/all-routes-map';
import { RouteDesc } from '@app/shared/_helpers/route-desc';

/**
 * If the whole route string would be '/nds/admin/ortho',
 * then this function would return 'admin/ortho'.
 */
export function getRouteStrWithoutLang(desc: RouteDesc): string
{
	let route: string = '';
	while (desc != undefined)
	{
		route = route == '' ? desc.path : desc.path + '/' + route;
		desc = desc.parent;
	}
	return route;
}

@Pipe({
	name: 'route',
	pure: true
})
export class RoutingPipe implements PipeTransform
{
	constructor(private translocoService: TranslocoService)
	{
	}

	transform(value: string, args?: any): string
	{
		return this.getRoute(value);
	}

	private getRoute(destinationID: string): string
	{
		let route: string = '';
		let desc: RouteDesc = allRoutesMap.get(destinationID);

		while (desc != undefined)
		{
			route = route == '' ? desc.path : desc.path + '/' + route;
			if (desc.parent === null && !desc.noLang) {
				route = this.translocoService.getActiveLang() + '/' + route;
			}
			desc = desc.parent;
		}

		return '/' + route;
	}
}