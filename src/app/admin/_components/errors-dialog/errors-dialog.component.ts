// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Message } from '@app/_models/message';
import { TRANSLOCO_SCOPE, TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { MatButton } from '@angular/material/button';
import { NgFor } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';

export class ErrorsInput
{
	messages: Message[];
}

@Component({
    selector: 'app-errors-dialog',
    templateUrl: './errors-dialog.component.html',
    styleUrls: ['./errors-dialog.component.scss'],
    providers: [
        { provide: TRANSLOCO_SCOPE, useValue: 'derr', multi: true }
    ],
    standalone: true,
    imports: [TranslocoDirective, MatDialogTitle, CdkScrollable, MatDialogContent, NgFor, MatDialogActions, MatButton, MatDialogClose]
})
export class ErrorsDialogComponent implements OnInit
{
	messages: Message[];

	constructor(
		public dialogRef: MatDialogRef<ErrorsDialogComponent>,
		@Inject(MAT_DIALOG_DATA) config: ErrorsInput,
		private transloco: TranslocoService)
	{
		this.messages = config.messages;
	}

	ngOnInit(): void
	{
	}

	getText(message: Message)
	{
		if (message) {
			let text = 'E' + message.code + ': ' + message.placeholderMessage;
			text = text.replace(/\{\{[a-zA-Z0-9_-]{1,64}\}\}/g, (match) => {
				let varName = match.substr(2, match.length - 4);
				for (let pair of message.arguments) {
					if (pair.key == varName) {
						return pair.value;
					}
				}
				return '';
			});
			return text;
		}
		return '';
	}
}
