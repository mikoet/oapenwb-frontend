// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { Routes } from '@angular/router'

import { MainComponent } from './dict/main/main.component'
import { TableViewComponent } from './dict/table-view/table-view.component'

import {
	ROUTE_DICT,
	ROUTE_TABLE_VIEW,
	ROUTE_SIGN_ON,
	ROUTE_ADMIN,
	ROUTE_DUTIES,
	ROUTE_IMPRINT,
	ROUTE_TERMS_OF_USE,
	ROUTE_DATA_PRIVACY,
	ROUTE_MAINTENANCE,
} from './routes'
import { ADMIN_AUTH_FN } from '@app/shared/_helpers/auth.guard'
import { ImprintComponent } from './dict/duty/imprint/imprint.component'
import { DEFAULT_UI_LOCALE } from './_config/config'
import { TRANSLOCO_SCOPE } from '@jsverse/transloco'

export const APP_ROUTES: Routes = [
	/*{
		path: '',
		component: StartComponent
	},*/
	{
		path: '',
		redirectTo: `${DEFAULT_UI_LOCALE}`,
		pathMatch: 'full',
	},
	{
		path: ':lang',
		children: [
			{
				path: ROUTE_DICT.path,
				component: MainComponent,
				children: [
					{
						path: '',
						redirectTo: ROUTE_TABLE_VIEW.path,
						pathMatch: 'full',
					},
					{
						path: ROUTE_TABLE_VIEW.path,
						component: TableViewComponent,
					},
					{
						path: ROUTE_TABLE_VIEW.path + '/:langPair',
						component: TableViewComponent,
					},
					/*{ path: 'detail', component: DetailViewComponent }*/
					{
						path: ROUTE_DUTIES.path,
						children: [
							/*{ path: ROUTE_DATA_PRIVACY.path, component: todo },
							{ path: ROUTE_TERMS_OF_USE.path, component: todo },*/
							{
								path: ROUTE_IMPRINT.path,
								component: ImprintComponent,
							},
						],
					},
				],
			},
			{
				path: ROUTE_MAINTENANCE.path,
				loadComponent: () => import('./maintenance/info.component').then((m) => m.InfoComponent),
			},
			{
				// Lazy load the SignOn routes and components
				path: ROUTE_SIGN_ON.path,
				loadChildren: () => import('./sign-on/sign-on.routes').then((m) => m.SIGN_ON_ROUTES),
				providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'son' }],
			},
			{
				// Lazy load the Admin routes and components
				path: ROUTE_ADMIN.path,
				canActivate: [ADMIN_AUTH_FN],
				loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
			},
			// todo { path: '**', component: PageNotFoundComponent }
		],
	},
]
