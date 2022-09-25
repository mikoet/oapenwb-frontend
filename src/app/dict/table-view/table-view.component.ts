// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { SearchService } from '@app/_services/search.service';
import { TranslocoService } from '@ngneat/transloco';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
	selector: 'app-table-view',
	templateUrl: './table-view.component.html',
	styleUrls: ['./table-view.component.scss']
})
export class TableViewComponent implements OnInit
{
	private readonly isMobile : boolean;

	@ViewChild('searchFormField')
	searchFormField: MatFormField;

	constructor(
		public search: SearchService,
		private deviceService: DeviceDetectorService,
		private transloco: TranslocoService)
	{
		this.isMobile = this.deviceService.isMobile();
	}

	ngOnInit(): void {
		this.transloco.langChanges$.subscribe(locale => {
			setTimeout(() => this.searchFormField.updateOutlineGap());
		});
	}

	clearSearch(): void {
		this.search.term = '';
	}

	executeSearch(element: HTMLElement) : void
	{
		console.debug("Executing search for: ", this.search.term);

		if (this.isMobile) {
			// Remove the focus on mobile devices so they close the onscreen keyboard
			this.removeFocus(element);
		}

		this.search.performSearch();
		/*
		console.log("Request - execute search for:", this.searchValue);
		this.blockUI.start();
		setTimeout(() => {
			this.resultVisible = this.searchValue.length > 0;
			this.blockUI.stop();
		}, 1200);
		*/
	}

	private removeFocus(element: HTMLElement) : void
	{
		if (!!element) {
			// Force keyboard to hide on input field
			element.setAttribute('readonly', 'readonly');
			// Force keyboard to hide on textarea field
			element.setAttribute('disabled', 'true');
			setTimeout(function() {
				// Close the keyboard
				element.blur();
				// Remove the attributes once the keyboard is hidden
				element.removeAttribute('readonly');
				element.removeAttribute('disabled');
			}, 100);
		}
	}

	addTextAtCaret(textAreaId, text) {
		const textArea: any = document.getElementById(textAreaId);
		const cursorPosition = textArea.selectionStart;
		this.addTextAtCursorPosition(cursorPosition, text);
		this.updateCursorPosition(cursorPosition, text, textArea);
	}
	private addTextAtCursorPosition(cursorPosition, text) {
		const front = this.search.term.substring(0, cursorPosition);
		const back = this.search.term.substring(cursorPosition, this.search.term.length);
		this.search.term = front + text + back;
	}
	private updateCursorPosition(cursorPosition, text, textArea) {
		cursorPosition = cursorPosition + text.length;
		setTimeout(() => {
			textArea.setSelectionRange(cursorPosition, cursorPosition);
			textArea.focus();
		}, 0);
	}
}
