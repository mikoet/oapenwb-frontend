// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ReplaySubject } from 'rxjs';
import {
	debounceTime, distinctUntilChanged, startWith, switchMap, take, takeUntil
} from 'rxjs/operators';

import { isPlatformBrowser } from '@angular/common';
import {
	Component, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormField } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import { Direction } from '@app/_models/dict-api';
import { LemmaService } from '@app/_services/lemma.service';
import { SearchService } from '@app/_services/search.service';
import { QP_TABLE_VIEW_DIRECTION, QP_TABLE_VIEW_PAIR, QP_TABLE_VIEW_TERM } from '@app/routes';
import { TranslocoService } from '@ngneat/transloco';

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

	@ViewChild('searchFormField')
	searchFormField: MatFormField;

	@ViewChild('searchInput', { read: MatAutocompleteTrigger })
  	autoCompleteTrigger: MatAutocompleteTrigger;

	searchControl = new UntypedFormControl();

	performedSearch = false;
	hasDesktopWidth = false;

	destroy$ = new ReplaySubject(1);

	private isMobile : boolean;

	constructor(
		public search: SearchService,
		public lemma: LemmaService,
		private deviceService: DeviceDetectorService,
		@Inject(PLATFORM_ID) private platformId: any,
		private transloco: TranslocoService,
		private route: ActivatedRoute,
		private router: Router,
		private zone: NgZone,
	) {
		this.isMobile = this.deviceService.isMobile() || window.innerWidth < 650;
		if (isPlatformBrowser(platformId)) {
			this.hasDesktopWidth = window.innerWidth >= 1024;
		} else {
			// Hypothetically
			this.hasDesktopWidth = true;
		}

		if (this.search.term?.trim() !== '') {
			this.performedSearch = true;
			this.adaptNavigation(true);
		}
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.hasDesktopWidth = event.target.innerWidth >= 1024;
		this.isMobile = this.deviceService.isMobile() || window.innerWidth < 650;
	}

	ngOnInit(): void {
		// Transfer all value changes into the SearchService's term property
		this.searchControl.valueChanges.pipe(
			takeUntil(this.destroy$),
		).subscribe(value => this.search.term = value);

		// Autocompletion
		this.searchControl.valueChanges.pipe(
			startWith(''),
			debounceTime(300),
			distinctUntilChanged(),
			switchMap(value => {
				return this.search.requestAutocompletion();
			}),
			takeUntil(this.destroy$),
		).subscribe();

		// Optical fix
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
			this.searchControl.setValue(term);
			this.executeSearch();
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	clearSearch(): void {
		this.searchControl.setValue('');
		this.search.clearSearch();
	}

	executeSearch(element?: HTMLElement): void
	{
		this.blockUI.start();
		this.autoCompleteTrigger?.closePanel();

		this.search.performSearch().pipe(
			take(1),
			takeUntil(this.destroy$),
		).subscribe(
			response => {
				if (!this.performedSearch) {
					this.performedSearch = true;
					this.zone.run(() => this.searchFormField.updateOutlineGap());
				}
				this.blockUI.stop();
			},
			error => {
				// TODO Show an error text in this case
				console.error('Error performing search request', error);
				this.blockUI.stop();
			}
		);

		this.adaptNavigation();

		if (!!element && this.isMobile) {
			// Remove the focus on mobile devices so the onscreen keyboard gets closed
			this.removeFocus(element);
		}
	}

	onFocus(searchArea: any): void {
		if (this.isMobile) {
			// Prevents misplaced autocompletion list on iOS devices (and maybe others?)
			this.search.resetAutocompletion();

			// Timeout is needed to prevent scrolling to wrong position on iOS devices (and maybe others?)
			// because iOS Safari also scrolls when it opens the onscreen keyboard.
			setTimeout(() => {
				searchArea?.scrollIntoView({
					behavior: "smooth",
					block: "start",
					inline: "nearest"
				});
			}, 200);
		}
	}

	private adaptNavigation(replaceUrl?: boolean): void {
		this.zone.run(async () => {
			await this.router.navigate([], {
				relativeTo: this.route,
				replaceUrl,
				queryParams: {
					[QP_TABLE_VIEW_PAIR]: this.search.pair,
					[QP_TABLE_VIEW_DIRECTION]: this.search.direction,
					[QP_TABLE_VIEW_TERM]: this.search.term,
				},
			});
		});
	}

	private removeFocus(element: HTMLElement): void {
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
		const front = this.searchControl.value?.substring(0, cursorPosition) ?? '';
		const back = this.searchControl.value?.substring(cursorPosition, this.searchControl.value?.length) ?? '';
		this.searchControl.setValue(front + text + back);
	}
	private updateCursorPosition(cursorPosition, text, textArea) {
		cursorPosition = cursorPosition + text.length;
		setTimeout(() => {
			textArea.setSelectionRange(cursorPosition, cursorPosition);
			textArea.focus();
		}, 0);
	}
}
