// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { MarkdownComponent } from '../../../shared/_components/markdown/markdown.component';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-imprint',
    templateUrl: './imprint.component.html',
    styleUrls: ['./imprint.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, NgIf, MarkdownComponent]
})
export class ImprintComponent implements OnInit
{
	constructor(
		public readonly transloco: TranslocoService,
	) { }

	ngOnInit(): void {
	}
}
