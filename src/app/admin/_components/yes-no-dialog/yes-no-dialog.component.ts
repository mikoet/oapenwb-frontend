// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslocoService, TRANSLOCO_SCOPE } from '@jsverse/transloco';

export class YesNoInput
{
	uitIdTitle: string;
	uitIdContent: string;
}

@Component({
	selector: 'app-yes-no-dialog',
	templateUrl: './yes-no-dialog.component.html',
	styleUrls: ['./yes-no-dialog.component.scss'],
	providers: [
		{ provide: TRANSLOCO_SCOPE, useValue: 'dyn', multi: true}
	]
})
export class YesNoDialogComponent implements OnInit
{
	uitIdTitle: string;
	uitIdContent: string;

	constructor(public dialogRef: MatDialogRef<YesNoDialogComponent>,
		@Inject(MAT_DIALOG_DATA) config: YesNoInput, private transloco: TranslocoService)
	{
		this.uitIdTitle = config.uitIdTitle;
		this.uitIdContent = config.uitIdContent;
	}

	ngOnInit(): void
	{
	}
}