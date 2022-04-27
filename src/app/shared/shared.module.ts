// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslocoRootModule } from '@app/transloco-root.module';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { LemmaComponentComponent } from './_components/lemma-component/lemma-component.component';

@NgModule({
	declarations: [
		RoutingPipe,
		LemmaComponentComponent,
	],
	imports: [
		CommonModule,
		TranslocoRootModule
	],
	exports: [
		RoutingPipe,
		LemmaComponentComponent
	]
})
export class SharedModule { }
