// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ListComponent } from '@app/admin/lexemes/list/list.component';
import { TabSememesComponent } from '@app/admin/lexemes/tab-3-sememes/tab-sememes.component';
import { LexemeSlimPlus, LexemeSlimDTO, SSearchResult, SememeSlim } from '@app/admin/_models/oapenwb-api';
import { DataService } from '@app/admin/_services/data.service';
import { SememeService } from '@app/admin/_services/sememe.service';
import { SCOPE_LEXEME_TYPES } from '@app/_base/ui-scopes';
import { Response } from '@app/_models/response';
import { TranslocoService } from '@ngneat/transloco';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import { debounceTime, tap, filter, takeUntil, switchMap } from 'rxjs/operators';

const DEFAULT_HEIGHT: number = 2;

@Component({
	selector: 'admin-sememe-link',
	templateUrl: './sememe-link.component.html',
	styleUrls: ['./sememe-link.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SememeLinkComponent),
			multi: true
		}
	]
})
export class SememeLinkComponent implements OnInit, OnDestroy, ControlValueAccessor
{
	/*
	sememeCompare = (o1: SememeSlim, o2: SememeSlim) =>  {
		if (o1 == o2) {
			return true;
		}
		if (!o1 || !o2) {
			return false;
		}
		return o1 == o2 || (o1.id == o2.id);
	}
	*/
	sememeCompare = (o1: number, o2: number) =>  o1 == o2;

	public linkCtrl: FormControl = new FormControl();
	private previousValue: any = null; // just to keep the previous value
	// Control for filter field
	public linkFilteringCtrl: FormControl = new FormControl();

	// The loaded or created SynGroup that is kept internal and can be accessed from the outside
	_sememe: SememeSlim = null;
	public get sememe() {
		return this._sememe;
	}
	public set sememe(sememe: SememeSlim) {
		if (this._sememe != sememe) {
			if (this.linkCtrl.value != sememe.id) {
				// Perform reset of the component only then the new sememe differs from
				this.resetComponent();
			}
			this._sememe = sememe;
			this.previousValue = sememe;
			if (!!sememe) {
				this.linkCtrl.setValue(sememe.id);
			} else {
				this.linkCtrl.setValue(null);
			}
			this.sememeChange.emit(this._sememe);
		}
	}

	@Output()
	sememeChange = new EventEmitter<SememeSlim>();

	@Input()
	typeID: number = null;

	@Input()
	langID: number = null;

	/** indicate search operation is in progress */
	public searching = false;

	/** last search result after server side search */
	// TODO any was LexemeItem
	public filteredLexemes: ReplaySubject<LexemeSlimPlus[]> = new ReplaySubject<LexemeSlimPlus[]>(1);

	public showLexemeSection: boolean = false;

	private height: number = DEFAULT_HEIGHT;

	private langChangeSubscription: Subscription;
	private sememeTran: string = 'Sememe';

	/** Subject that emits when the component has been destroyed. */
	protected _onDestroy = new Subject<void>();

	public constructor(
		private transloco: TranslocoService,
		private readonly sememeService: SememeService,
		private readonly data: DataService)
	{
		// Get the translation for the term 'sememe'
		this.langChangeSubscription = this.transloco.langChanges$.subscribe(lang => {
			this.sememeTran = this.transloco.translate('admin.sememe');
		});
		this.sememeTran = this.transloco.translate('admin.sememe');
	}

	ngOnInit() {
		this.linkFilteringCtrl.valueChanges.pipe(
			filter(search => !!search),
			tap(() => this.searching = true),
			takeUntil(this._onDestroy),
			debounceTime(200),
			switchMap(search => {
				return this.sememeService.loadTransient(search, this.langID);
			}),
			takeUntil(this._onDestroy)
		).subscribe(response => {
			this.searching = false;
			if (response.status === 'success') {
				this.showLexemeSection = response.data.lexemes.length > 0;
				this.calculateHeight(response);
				this.filteredLexemes.next(response.data.lexemes);
			} else {
				this.resetComponent();
			}
		}, error => {
			this.searching = false;
			// TODO handle error?
			this.showLexemeSection = false;
			this.resetComponent();
		});
		
		this.linkCtrl.valueChanges.pipe(
			takeUntil(this._onDestroy)
		).subscribe(value => {
			if (this.previousValue != value) {
				// Only call this when the value changed to avoid unnecessary change flag toggles on the lexeme
				this.onChange(value); // <--- dat gaev dat hyr je al
			}
			this.previousValue = value;
		})
	}

	ngOnDestroy() {
		this.langChangeSubscription.unsubscribe();
		this._onDestroy.next();
		this._onDestroy.complete();
	}

	selectionChanged($event: MatSelectChange)
	{
		if (!!$event.value) {
			// Set the sememe
			let id = $event.value;
			this.sememeService.loadSlimByID(id).subscribe(sememe => {
				this.sememe = sememe;
			});
		} else {
			this.sememe = null;
		}
		// do it
		//this.onChange(this.sememe);
	}

	public resetComponent() : void
	{
		this.calculateHeight(null);
		this.showLexemeSection = false;
		this.filteredLexemes.next([]);
		this._sememe = null;
		this.linkCtrl.reset();
		this.previousValue = null;
	}

	getPanelClass() : string
	{
		return 'panelHeight-' + this.height;
	}

	calculateHeight(response: Response<SSearchResult>) : void
	{
		if (!response) {
			this.height = DEFAULT_HEIGHT;
			return;
		}

		let lexemesHeight = 0;
		response.data.lexemes?.forEach(lexeme => {
			lexemesHeight += 1 + lexeme?.sememes?.length;
		});
		this.height = 2 + (this.showLexemeSection ? 1 : 0) + lexemesHeight;

		if (this.height > 7) {
			this.height = 7;
		}
	}

	buildCaption(lexeme: LexemeSlimDTO) : string
	{
		// Build the lexeme's main lemma
		let result = ListComponent.buildLemmaStatic(lexeme);
		// Get the localised type name
		let typeUit = this.data.store.lexemeTypes.get(lexeme.typeID)?.uitID;
		if (!!typeUit) {
			let text = this.transloco.translate(`${SCOPE_LEXEME_TYPES}.${typeUit}`)
			if (!!text) {
				result += ` (${text})`;
			}
		}
		result += lexeme.active ? ' 🟢' : ' 🔴';
		return result;
	}

	buildSememeName(sememe: SememeSlim, index: number) : string
	{
		let result = '';
		if (!!sememe?.internalName) {
			result = TabSememesComponent.prepare(sememe.internalName, this.transloco);
		} else if (!!sememe?.spec) {
			result = sememe.spec;
		} else {
			result = this.sememeTran + ' ' + (index+1);
		}
		result += sememe.active ? ' 🟢' : ' 🔴';
		return result;
	}

	public formatPresentation(sememe: SememeSlim) : string
	{
		return SememeLinkComponent.FormatPresentation(this.data, this.transloco, sememe);
	}

	public static FormatPresentation(data: DataService, transloco: TranslocoService, sememe: SememeSlim) : string
	{
		if (!!sememe) {
			// Build the lemma
			let result = '';
			if (sememe.pre != null) {
				result += sememe.pre + ' ';
			}
			result += sememe.main;
			if (sememe.post != null) {
				result += ' ' + sememe.post
			}
			if (sememe.spec != null) {
				result += ' – ' + sememe.spec;
			}
			if (sememe.internalName != null) {
				let name = TabSememesComponent.prepare(sememe.internalName, transloco);
				result += ' (' + name + ')';
			}
			// Get the lexeme type
			let type = data.store.lexemeTypes.get(sememe.typeID);
			if (!!type) {
				let uit = transloco.translate(`full.${type.uitID}`);
				if (!!uit) {
					result += ' [' + uit + ']';
				}
			}
			return result;
		}
		return '–';
	}

	// Code for interface ControlValueAccessor

	onChange: any = () => {}
	onTouch: any = () => {}

	writeValue(input: number): void {
		if (!!input) {
			if (!!this._sememe && this._sememe.id == input) {
				// The sememe is already there, nothing to do
			} else {
				this.sememeService.loadSlimByID(input).subscribe(sememe => {
					this.resetComponent();
					this.sememe = sememe;
					this.linkCtrl.setValue(sememe?.id);
				});
			}
		} else {
			this.resetComponent();
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
			this.linkCtrl.disable({ emitEvent: false });
		} else {
			this.linkCtrl.enable({ emitEvent: false }); // { updateOn: 'blur' }
		}
	}
}
