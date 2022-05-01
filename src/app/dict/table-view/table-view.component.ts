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

	executeSearch(): void {
		console.debug("Executing search for: ", this.search.term);
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
