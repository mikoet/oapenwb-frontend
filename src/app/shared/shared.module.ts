// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';

import { TranslocoRootModule } from '@app/transloco-root.module';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { LemmaComponentComponent } from './_components/lemma-component/lemma-component.component';
import { MarkdownComponent } from './_components/markdown/markdown.component';

@NgModule({
	declarations: [
		RoutingPipe,
		LemmaComponentComponent,
		MarkdownComponent,
	],
	imports: [
		CommonModule,
		TranslocoRootModule,
		MarkdownModule.forRoot(),
	],
	exports: [
		RoutingPipe,
		LemmaComponentComponent,
		MarkdownComponent,
	]
})
export class SharedModule { }
