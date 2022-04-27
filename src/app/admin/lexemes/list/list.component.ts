// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { DataService } from '@app/admin/_services/data.service';
import { LexemeQueryService } from '@app/admin/_services/lexeme-query.service';
import { HeldLexeme, LexemeOrigin, LexemeService, SelectedLexeme } from '@app/admin/_services/lexeme.service';
import { Pagination } from '@app/_models/response';
import { LexemeSlimDTO } from '@app/admin/_models/oapenwb-api';
import { TranslocoService } from '@ngneat/transloco';
import { MatSelectionListChange } from '@angular/material/list';
import { FilterMenuComponent } from '../filter-menu/filter-menu.component';
import { LockService } from '@app/admin/_services/lock.service';
import { catchError, map, tap } from 'rxjs/operators';

@Component({
	selector: 'admin-lexeme-list',
	templateUrl: './list.component.html',
	styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy
{
	@Output() loadClick = new EventEmitter<void>();
	@Output() lexemeSelect = new EventEmitter<SelectedLexeme>();
	@Output() nextClick = new EventEmitter<void>();
	@Output() previousClick = new EventEmitter<void>();

	@ViewChild('filterMenu')
	private filterMenu: FilterMenuComponent;

	// Must be an array, but it shall only hold the one selected lexeme of the list
	selectedLexemes: SelectedLexeme[] = [];
	compareFunction = (o1: any, o2: any) => o1.index === o2.index && o1.id === o2.id && o1.origin === o2.origin;

	// Data from LexemeQueryService
	lexemes: Observable<LexemeSlimDTO[]>;
	pagination: Observable<Pagination>;
	private pageSubscription: Subscription;

	// Data from LexemeService
	topLexemes: Observable<HeldLexeme[]>;
	private activeSubscription: Subscription;

	private _hasNext: boolean = false;
	get hasNext(): boolean {
		return this._hasNext;
	}

	private _hasPrevious: boolean = false;
	get hasPrevious(): boolean {
		return this._hasPrevious;
	}

	private _btnClicked: boolean = false;
	get btnClicked(): boolean {
		return this._btnClicked;
	}

	offset: number = 0;
	limit: number = 50;
	total: number = 0;

	constructor(private transloco: TranslocoService, public lexemeQuery: LexemeQueryService,
		public lexemeService: LexemeService, public data: DataService, private readonly lockService: LockService) { }

	ngOnInit(): void {
		this.lexemes = this.lexemeQuery.lexemes;
		this.pagination = this.lexemeQuery.pagination;

		this.pageSubscription = this.pagination.subscribe(pagination => {
			if (pagination !== null) {
				this.offset = pagination.offset;
				this.limit = pagination.limit;
				this.total = pagination.total;
				this._hasNext = (this.offset + this.limit) < this.total;
				this._hasPrevious = this.offset > 0;
			}
			this._btnClicked = false;
		});

		this.topLexemes = this.lexemeService.heldLexemes;

		this.activeSubscription = this.lexemeService.activeLexeme.subscribe(active => {
			if (active === null) {
				this.selectedLexemes = [];
			} else {
				if (active.origin === LexemeOrigin.TopList) {
					this.selectedLexemes = [{
						index: active.index,
						origin: LexemeOrigin.TopList
					}];
				} else {
					this.selectedLexemes = [{
						id: active.id,
						origin: LexemeOrigin.LexemeList
					}];
				}
			}
		});

		this.lockService.connect();
		this.lockService.messages$.subscribe(msg => {
			console.log('New message:', msg);
		});
		/*liveData$ =*/ this.lockService.messages$.pipe(
			//map(rows => rows.data),
			catchError(error => { throw error }),
			tap({
				error: error => console.log('[Live component] Error:', error),
				complete: () => console.log('[Live component] Connection Closed')
			})
		).subscribe(msg => {
			console.log(msg);
		});
		this.lockService.sendMessage("bla");
	}

	ngOnDestroy(): void {
		this.pageSubscription.unsubscribe();
		this.activeSubscription.unsubscribe();
	}

	loadClicked() : void {
		this._btnClicked = true;
		// emit the event but set the filter options directly (no good design, but works well for now)
		this.lexemeQuery.filterOptions = this.filterMenu.getFilterOptions();
		this.loadClick.emit();
	}

	nextClicked() : void {
		this._btnClicked = true;
		this.nextClick.emit();
	}

	previousClicked() : void {
		this._btnClicked = true;
		this.previousClick.emit();
	}

	public nextPage(): void {
		this.lexemeQuery.loadAndKeep(this.offset + this.limit, this.limit);
	}

	public previousPage(): void {
		this.lexemeQuery.loadAndKeep(this.offset - this.limit, this.limit);
	}

	selectionChanged(event: MatSelectionListChange): void {
		if (event.options.length === 0) {
			this.lexemeSelect.emit(null);
			return;
		}

		let origin: LexemeOrigin = event.options[0]?.value?.origin;
		if (origin === LexemeOrigin.TopList) {
			this.lexemeSelect.emit({ origin: origin, index: event.options[0]?.value?.index });
		} else {
			this.lexemeSelect.emit({ origin: origin, id: event.options[0]?.value?.id });
		}
	}

	buildLemma(lexeme: LexemeSlimDTO) : string {
		return ListComponent.buildLemmaStatic(lexeme);
	}

	public static buildLemmaStatic(lexeme: LexemeSlimDTO) : string {
		if (!!lexeme) {
			let lemma = '';
			if (lexeme.pre != null) {
				lemma += lexeme.pre + ' ';
			}
			lemma += lexeme.main;
			if (lexeme.post != null) {
				lemma += ' ' + lexeme.post
			}
			return lemma;
		}
		return '–';
	}

	getTopListIcon(lexeme: HeldLexeme) : string {
		if (lexeme.persistent && !lexeme.changed && !lexeme.decoupled) {
			return 'sync_alt';
		} else if (lexeme.decoupled) {
			return 'pan_tool';
		}
		return 'mode_edit';
	}

	getIcon(condition: number) : string {
		switch (condition) {
			case 1:
				return 'sentiment_very_dissatisfied';
			case 2:
				return 'sentiment_dissatisfied';
			case 3:
				return 'sentiment_neutral';
			case 4:
				return 'sentiment_satisfied';
			case 5:
				return 'sentiment_very_satisfied';
		}
		return '';
	}

	getLanguageName(id: number) : string {
		if (id !== null && id !== undefined) {
			return this.data.store.languages?.get(id)?.locale;
		} else {
			return '–';
		}
	}

	getLexemeTypeName(id: number) : string {
		if (id !== null && id !== undefined) {
			return this.transloco.translate('full.' + this.data.store.lexemeTypes?.get(id)?.uitID);
		} else {
			return '–';
		}
	}

	buildTagString(tags: string[]) : string {
		let result = '';
		if (tags !== null) {
			let first = true;
			if (tags !== null && tags !== undefined) {
				for (let tag of tags) {
					result += first ? tag : ', ' + tag;
					first = false;
				}
			}
		} 
		return result;
	}
}