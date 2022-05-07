// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { SearchService } from '@app/_services/search.service';

@Component({
	selector: 'app-table-view',
	templateUrl: './table-view.component.html',
	styleUrls: ['./table-view.component.scss']
})
export class TableViewComponent implements OnInit
{
	constructor(public search: SearchService)
	{
	}

	ngOnInit(): void {
	}

	clearSearch(): void {
		this.search.term = '';
	}

	executeSearch(element: HTMLElement) : void
	{
		console.debug("Executing search for: ", this.search.term);
		this.removeFocus(element);
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
			element.setAttribute('readonly', 'readonly'); // Force keyboard to hide on input field.
			element.setAttribute('disabled', 'true'); // Force keyboard to hide on textarea field.
			setTimeout(function() {
				element.blur();  //actually close the keyboard
				// Remove readonly attribute after keyboard is hidden.
				element.removeAttribute('readonly');
				element.removeAttribute('disabled');
			}, 100);
		}
	}

	addTextAtCaret(textAreaId, text) {
		let textArea: any = document.getElementById(textAreaId);
		let cursorPosition = textArea.selectionStart;
		this.addTextAtCursorPosition(textArea, cursorPosition, text);
		this.updateCursorPosition(cursorPosition, text, textArea);
	}
	addTextAtCursorPosition(textArea, cursorPosition, text) {
		let front = (textArea.value).substring(0, cursorPosition);
		let back = (textArea.value).substring(cursorPosition, textArea.value.length);
		textArea.value = front + text + back;
	}
	updateCursorPosition(cursorPosition, text, textArea) {
		cursorPosition = cursorPosition + text.length;
		textArea.selectionStart = cursorPosition;
		textArea.selectionEnd = cursorPosition;
		textArea.focus();    
	}
}
