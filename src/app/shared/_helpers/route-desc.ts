// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
export class RouteDesc
{
	id: string;
	path: string;
	parent: RouteDesc = null;
	noLang: boolean = false;

	constructor(init:Partial<RouteDesc>, allRoutesMap: Map<string, RouteDesc>)
	{
		Object.assign(this, init);
		if (allRoutesMap != undefined) {
			allRoutesMap.set(this.id, this);
		}
	}
}