// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './dict/main/main.component';
import { TableViewComponent } from './dict/table-view/table-view.component';

import { ROUTE_DICT, ROUTE_TABLE_VIEW, ROUTE_SIGN_ON, ROUTE_ADMIN } from './routes';
import { AuthGuard } from '@app/shared/_helpers/auth.guard';

const routes: Routes = [
	/*{
		path: '',
		component: StartComponent
	},*/
	{
		path: ':lang',
		children: [
			{
				path: ROUTE_DICT.path,
				component: MainComponent,
				children: [
					{ path: '', redirectTo: ROUTE_TABLE_VIEW.path, pathMatch: 'full' },
					{ path: ROUTE_TABLE_VIEW.path, component: TableViewComponent },
					{ path: ROUTE_TABLE_VIEW.path + '/:langPair', component: TableViewComponent },
					/*{ path: 'detail', component: DetailViewComponent }*/
				]
			},
			{
				// Lazy load the SignOn module
				path: ROUTE_SIGN_ON.path,
				loadChildren: () => import('./sign-on/sign-on.module').then(m => m.SignOnModule)
			},
			{
				// Lazy load the Admin module
				path: ROUTE_ADMIN.path,
				canActivate: [AuthGuard],
				loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
			},
			// todo { path: '**', component: PageNotFoundComponent }
		]
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes, {
		initialNavigation: 'enabled'
})],
	exports: [RouterModule]
})
export class AppRoutingModule { }
