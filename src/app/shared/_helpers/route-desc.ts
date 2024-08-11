// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

export class RouteDesc {
	readonly id: string
	readonly path: string
	readonly parent: RouteDesc = null
	readonly noLang: boolean = false

	constructor(init: Partial<RouteDesc>, allRoutesMap: Map<string, RouteDesc>) {
		this.id = init.id
		this.path = init.path
		this.parent = init.parent || null
		this.noLang = init.noLang || null

		if (allRoutesMap != undefined) {
			allRoutesMap.set(this.id, this)
		}
	}
}
