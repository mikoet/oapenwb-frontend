// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { TranslocoService, TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { MatButton } from '@angular/material/button';
import { CdkScrollable } from '@angular/cdk/scrolling';

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
        { provide: TRANSLOCO_SCOPE, useValue: 'dyn', multi: true }
    ],
    standalone: true,
    imports: [TranslocoDirective, MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
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