// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-never-to-be-used',
    templateUrl: './other-translations.component.html',
    styles: [''],
    standalone: true,
    imports: [TranslocoDirective]
})
export class OtherTranslationsComponent implements OnInit
{
	constructor()
	{}

	ngOnInit(): void
	{
	}
}
