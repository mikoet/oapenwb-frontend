// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListComponent } from '@app/admin/lexemes/list/list.component';
import { LexemeSlimDTO } from '@app/admin/_models/admin-api';
import { LexemeQueryService } from '@app/admin/_services/lexeme-query.service';
import { ReplaySubject } from 'rxjs';
import { debounceTime, tap, filter, takeUntil, switchMap } from 'rxjs/operators';

@Component({
	selector: 'admin-lexeme-link',
	templateUrl: './lexeme-link.component.html',
	styleUrls: ['./lexeme-link.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => LexemeLinkComponent),
			multi: true
		}
	]
})
export class LexemeLinkComponent implements OnInit, OnDestroy, ControlValueAccessor
{
	public readonly linkCtrl = new FormControl<number | null>(null);
	private previousValue: any = null; // just to keep the previous value
	// Control for filter field
	public readonly linkFilteringCtrl = new FormControl('');

	@Input()
	typeID: number = null;

	@Input()
	langID: number = null;

	@Input()
	labelUitID: string = 'showDetailsFrom';

	/** indicate search operation is in progress */
	public searching = false;

	/** list of filtered lexemes after server side search */
	public filteredLexemes: ReplaySubject<LexemeSlimDTO[]> = new ReplaySubject<LexemeSlimDTO[]>(1);

	/** Subject that emits when the component has been destroyed. */
	protected destroy$ = new ReplaySubject<void>(1);

	constructor(
		private readonly lexemeQuery: LexemeQueryService,
	) { }

	ngOnInit() {
		this.linkFilteringCtrl.valueChanges.pipe(
			filter(search => !!search),
			tap(() => this.searching = true),
			debounceTime(200),
			switchMap(search => {
				return this.lexemeQuery.loadTransient(search, {
					langIDs: [this.langID],
					typeIDs: [this.typeID],
					tags: null,
					state: 'Both'
				});
			}),
			takeUntil(this.destroy$),
		).subscribe({
			next: (response) => {
				this.searching = false;
				if (response.status === 'success') {
					this.filteredLexemes.next(response.data);
				}
			},
			error: (error) => {
				// TODO handle error
				this.searching = false;
			},
		});
		
		this.linkCtrl.valueChanges.pipe(
			takeUntil(this.destroy$)
		).subscribe(value => {
			if (this.previousValue !== value) {
				// Only call this when the value changed to avoid unnecessary change flag toggles on the lexeme
				this.onChange(value);
			}
			this.previousValue = value;
		})
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	buildLemma(lexeme: LexemeSlimDTO) : string
	{
		return ListComponent.buildLemmaStatic(lexeme);
	}

	// WA0001
	getValue() : number
	{
		return this.linkCtrl.value;
	}

	// Code for interface ControlValueAccessor

	onChange: any = () => {}
	onTouch: any = () => {}

	writeValue(value: number): void {
		if (!!value) {
			this.previousValue = value;
			this.linkCtrl.setValue(value, { emitEvent: false });

			this.lexemeQuery.loadSlimByID(value).subscribe((slimDTO) => {
				if (!!slimDTO) {
					this.filteredLexemes.next([ slimDTO ]);
				} else {
					// Error case. How to handle this properly?
					this.linkCtrl.setValue(null);
				}
			});
		} else {
			this.previousValue = null;
			this.filteredLexemes.next([]);
			this.linkCtrl.reset(null, { emitEvent: false });
		}
		
		// TODO Can the slimDTO be loaded here if it is not available?
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		if (isDisabled) {
			this.linkCtrl.disable();
		} else {
			this.linkCtrl.enable();
		}
	}
}