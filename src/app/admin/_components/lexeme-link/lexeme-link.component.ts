// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListComponent } from '@app/admin/lexemes/list/list.component';
import { LexemeSlimDTO } from '@app/admin/_models/admin-api';
import { LexemeQueryService } from '@app/admin/_services/lexeme-query.service';
import { ReplaySubject, Subject } from 'rxjs';
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
	public linkCtrl: FormControl = new FormControl();
	private previousValue: any = null; // just to keep the previous value
	// Control for filter field
	public linkFilteringCtrl: FormControl = new FormControl();

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
	protected _onDestroy = new Subject<void>();

	public constructor(private readonly lexemeQuery: LexemeQueryService) {}

	ngOnInit() {
		this.linkFilteringCtrl.valueChanges.pipe(
			filter(search => !!search),
			tap(() => this.searching = true),
			takeUntil(this._onDestroy),
			debounceTime(200),
			switchMap(search => {
				return this.lexemeQuery.loadTransient(search, {
					langIDs: [this.langID],
					typeIDs: [this.typeID],
					tags: null,
					state: 'Both'
				});
			}),
			takeUntil(this._onDestroy)
		).subscribe(response => {
			this.searching = false;
			if (response.status === 'success') {
				this.filteredLexemes.next(response.data);
			}
		}, error => {
			// no errors in our simulated example
			this.searching = false;
			// handle error...
		});
		
		this.linkCtrl.valueChanges.pipe(
			takeUntil(this._onDestroy)
		).subscribe(value => {
			if (this.previousValue != value) {
				// Only call this when the value changed to avoid unnecessary change flag toggles on the lexeme
				this.onChange(value);
			}
			this.previousValue = value;
		})
	}

	ngOnDestroy() {
		this._onDestroy.next();
		this._onDestroy.complete();
	}

	buildLemma(lexeme: LexemeSlimDTO) : string
	{
		return ListComponent.buildLemmaStatic(lexeme);
	}

	// WA0001
	getValue() : number
	{
		let value = this.linkCtrl.value;
		if (!!value) {
			return parseInt(value);
		}
		return null;
	}

	// Code for interface ControlValueAccessor

	onChange: any = () => {}
	onTouch: any = () => {}

	writeValue(input: string): void {
		if (!!input) {
			this.lexemeQuery.loadSlimByID(parseInt(input)).subscribe(slimDTO => {
				this.filteredLexemes.next([ slimDTO ]);
				this.linkCtrl.setValue(input, { emitEvent: false });
			})
		} else {
			this.filteredLexemes.next([]);
			this.linkCtrl.reset();
			//this.linkCtrl.setValue(null, { emitEvent: false });
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