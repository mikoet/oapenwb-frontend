// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';

import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { LemmaComponentComponent } from './_components/lemma-component/lemma-component.component';
import { MarkdownComponent } from './_components/markdown/markdown.component';

@NgModule({
	imports: [
		CommonModule,
		MarkdownModule.forRoot(),
		RoutingPipe,
		LemmaComponentComponent,
		MarkdownComponent,
	],
	exports: [
		RoutingPipe,
		LemmaComponentComponent,
		MarkdownComponent,
	]
})
export class SharedModule { }
