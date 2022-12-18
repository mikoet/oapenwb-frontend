// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoComponent } from './info/info.component';
import { RouterModule, Routes } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

const routes: Routes = [
	{
		path: '',
		component: InfoComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class SignOnRoutingModule { }


@NgModule({
	declarations: [
		InfoComponent
	],
	imports: [
		CommonModule,
		FontAwesomeModule,
		RouterModule,
		RouterModule.forChild(routes),
	]
})
export class MaintenanceModule { }
