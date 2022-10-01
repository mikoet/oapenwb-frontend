// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import { QP_TABLE_VIEW_DIRECTION, QP_TABLE_VIEW_PAIR, QP_TABLE_VIEW_TERM } from '@app/routes';
import { Direction } from '@app/_models/dict-api';
import { SearchService } from '@app/_services/search.service';
import { TranslocoService } from '@ngneat/transloco';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ReplaySubject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

function isDirection(str: string): str is Direction {
	return ['Both', 'Left', 'Right'].includes(str);
}

@Component({
	selector: 'app-table-view',
	templateUrl: './table-view.component.html',
	styleUrls: ['./table-view.component.scss']
})
export class TableViewComponent implements OnInit, OnDestroy
{
	@BlockUI()
	blockUI: NgBlockUI;

	private readonly isMobile : boolean;

	@ViewChild('searchFormField')
	searchFormField: MatFormField;

	destroy$ = new ReplaySubject(1);

	constructor(
		public search: SearchService,
		private deviceService: DeviceDetectorService,
		private transloco: TranslocoService,
		private route: ActivatedRoute,
		private router: Router,
	) {
		this.isMobile = this.deviceService.isMobile();
	}

	ngOnInit(): void {
		this.transloco.langChanges$.pipe(
			takeUntil(this.destroy$),
		).subscribe(locale => {
			setTimeout(() => this.searchFormField.updateOutlineGap());
		});

		this.readQueryParams();
	}

	private readQueryParams(): void {
		const pair: string = this.route.snapshot.queryParamMap.get(QP_TABLE_VIEW_PAIR);
		const direction: string = this.route.snapshot.queryParamMap.get(QP_TABLE_VIEW_DIRECTION);
		const term: string = this.route.snapshot.queryParamMap.get(QP_TABLE_VIEW_TERM);

		if (!!pair) {
			this.search.pair = pair;
		}

		if (!!direction && isDirection(direction)) {
			this.search.direction = direction as Direction;
		}

		if (!!term) {
			this.search.term = term;
			this.executeSearch();
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	clearSearch(): void {
		this.search.term = '';
	}

	executeSearch(element?: HTMLElement): void
	{
		this.blockUI.start();

		this.search.performSearch().pipe(
			take(1),
			takeUntil(this.destroy$),
		).subscribe(
			response => {
				this.blockUI.stop();
			},
			// TODO this should also stop the blocking and give an error
			error => {
				console.error('Error performing search request', error);
				this.blockUI.stop();
			}
		);

		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: {
				pår: this.search.pair,
				richt: this.search.direction,
				term: this.search.term,
			},
		});

		if (!!element && this.isMobile) {
			// Remove the focus on mobile devices so they close the onscreen keyboard
			this.removeFocus(element);
		}
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
