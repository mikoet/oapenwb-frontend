// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ListComponent } from '@app/admin/lexemes/list/list.component';
import { TabSememesComponent } from '@app/admin/lexemes/tab-3-sememes/tab-sememes.component';
import { LexemeSlimPlus, LexemeSlimDTO, Sememe, SGSearchResult, SynGroup, SynGroupItem } from '@app/admin/_models/admin-api';
import { ApiAction } from '@app/admin/_models/enums';
import { DataService } from '@app/admin/_services/data.service';
import { SynGroupQueryService } from '@app/admin/_services/syn-group-query.service';
import { SCOPE_LEXEME_TYPES } from '@app/_base/ui-scopes';
import { Response } from '@app/_models/response';
import { LemmaService } from '@app/_services/lemma.service';
import { TranslocoService } from '@ngneat/transloco';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import { debounceTime, tap, filter, takeUntil, switchMap } from 'rxjs/operators';

export type SelectionType = "SynGroup" | "Sememe";

export interface Selection
{
	type: SelectionType;
	id: number;
	text: string;
	lexeme?: string;
}

const DEFAULT_HEIGHT: number = 2;

@Component({
	selector: 'admin-syn-group-link',
	templateUrl: './syn-group-link.component.html',
	styleUrls: ['./syn-group-link.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SynGroupLinkComponent),
			multi: true
		}
	]
})
export class SynGroupLinkComponent implements OnInit, OnDestroy, ControlValueAccessor
{
	// Selection compare
	selectionCompare = (o1: Selection, o2: Selection) =>  {
		if (o1 == o2) {
			return true;
		}
		if (!o1 || !o2) {
			return false;
		}
		return o1 == o2 || (o1.type == o2.type && o1.id == o2.id);
	}

	public readonly linkCtrl = new FormControl<Selection | null>(null);
	private previousValue: any = null; // just to keep the previous value
	// Control for filter field
	public readonly linkFilteringCtrl = new FormControl('');

	// The loaded or created SynGroup that is kept internal and can be accessed from the outside
	_synGroup: SynGroup = null;
	public get synGroup() {
		return this._synGroup;
	}
	public set synGroup(synGroup: SynGroup) {
		if (this.synGroup != synGroup) {
			// Reset the component
			this.resetComponent();
			// Set the SynGroup
			this.showSynGroupSection = !!synGroup;
			this.filteredSynGroups.next([ synGroup ]);
			this._synGroup = synGroup;
			this.previousValue = synGroup;
			if (!!synGroup) {
				this.linkCtrl.setValue(<Selection>{ type: 'SynGroup', id: synGroup.id, text: synGroup.presentation });
			} else {
				this.linkCtrl.setValue(null);
			}
			this.synGroupChange.emit(this._synGroup);
		}
	}

	@Output()
	synGroupChange = new EventEmitter<SynGroup>();

	/**
	 * TODO In future releases the lexemeservice could know the active sememe (as well as variant) so that we could
	 * retrieve the active sememe's ID directly from there. But since then we'll have it as an input property
	 * here.
	 */
	@Input()
	sememeID: number = null;

	@Input()
	typeID: number = null;

	@Input()
	langID: number = null;

	/** indicate search operation is in progress */
	public searching = false;

	/** last search result after server side search */
	public filteredSynGroups: ReplaySubject<SynGroupItem[]> = new ReplaySubject<SynGroupItem[]>(1);
	public filteredLexemes: ReplaySubject<LexemeSlimPlus[]> = new ReplaySubject<LexemeSlimPlus[]>(1);

	public showSynGroupSection: boolean = false;
	public showLexemeSection: boolean = false;

	private height: number = DEFAULT_HEIGHT;

	private langChangeSubscription: Subscription;
	private sememeTran: string = 'Sememe';

	/** Subject that emits when the component has been destroyed. */
	protected _onDestroy = new Subject<void>();

	public constructor(
		private transloco: TranslocoService,
		private readonly synGroupService: SynGroupQueryService,
		private readonly lemmaService: LemmaService,
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
				return this.synGroupService.loadTransient(search, this.langID);
			}),
			takeUntil(this._onDestroy)
		).subscribe(response => {
			this.searching = false;
			if (response.status === 'success') {
				this.showSynGroupSection = response.data.synGroups.length > 0;
				this.showLexemeSection = response.data.lexemes.length > 0;
				this.calculateHeight(response);
				this.filteredSynGroups.next(response.data.synGroups);
				this.filteredLexemes.next(response.data.lexemes);
			} else {
				this.resetComponent();
			}
		}, error => {
			this.searching = false;
			// TODO handle error?
			this.showSynGroupSection = false;
			this.showLexemeSection = false;
			this.resetComponent();
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
		this.langChangeSubscription.unsubscribe();
		this._onDestroy.next();
		this._onDestroy.complete();
	}

	selectionChanged($event: MatSelectChange)
	{
		if (!!$event.value) {
			let selection: Selection = $event.value;
			if (selection.type == 'SynGroup') {
				//doEnabling = false; // is done in the lambda
				// Straight forward: Lock the SynGroup (TODO:SG), load it and set it on this component
				this.synGroupService.loadByID(selection.id).subscribe(synGroup => {
					synGroup.sememeIDs = [ ...synGroup.sememeIDs, this.sememeID ];
					synGroup.apiAction = ApiAction.Update;
					this.synGroup = synGroup;
				});
			} else if (selection.type == 'Sememe') {
				// Create a new SynGroup
				this.synGroup = this.synGroupService.createSynGroup();
				this.synGroup.sememeIDs = [ selection.id, this.sememeID ];
				this.synGroup.presentation = this.transloco.translate('admin.newSynGroupWith', {
					sememe: selection.text,
					lexeme: selection.lexeme
				});
			}
		} else {
			this.synGroup = null;
		}
	}

	public resetComponent() : void
	{
		this.calculateHeight(null);
		this.showSynGroupSection = false;
		this.showLexemeSection = false;
		this.filteredSynGroups.next([]);
		this.filteredLexemes.next([]);
		this._synGroup = null;
		this.linkCtrl.reset();
		this.previousValue = null;
	}

	getPanelClass() : string
	{
		return 'panelHeight-' + this.height;
	}

	calculateHeight(response: Response<SGSearchResult>) : void
	{
		if (!response) {
			this.height = DEFAULT_HEIGHT;
			return;
		}

		let lexemesHeight = 0;
		response.data.lexemes?.forEach(lexeme => {
			lexemesHeight += 1 + lexeme?.sememes?.length;
		});
		this.height = 2 + (this.showSynGroupSection ? 1 : 0) + (this.showLexemeSection ? 1 : 0)
					+ response.data.synGroups.length + lexemesHeight;

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
		return result;
	}

	buildSememeName(sememe: Sememe, index: number) : string
	{
		if (!!sememe?.internalName) {
			return TabSememesComponent.prepare(sememe.internalName, this.transloco);
		}
		if (!!sememe?.spec) {
			return sememe.spec;
		}
		return this.sememeTran + ' ' + (index+1);
	}

	// WA0001
	getValue() : number
	{
		return this.linkCtrl.value?.id ?? null;

		/* FIXME NGU14 remove if above code works
		let value = this.linkCtrl.value;
		if (!!value) {
			return parseInt(value);
		}
		return null;
		*/
	}

	formatPresentation(text: string) : string
	{
		return this.lemmaService.formatLemmaStr(text);
	}

	// Code for interface ControlValueAccessor

	onChange: any = () => {}
	onTouch: any = () => {}

	writeValue(input: Selection): void {
		if (!!input) {
			if (!!this._synGroup && this._synGroup.id == input.id) {
				// The SynGroup is already there, nothing to do
			} else {
				this.synGroupService.loadByID(input.id).subscribe(synGroup => {
					this.resetComponent();
					this.synGroup = synGroup;
					/*
					this.showSynGroupSection = !!synGroup;
					this.filteredSynGroups.next([ synGroup ]);
					this.showLexemeSection = false;
					this.filteredLexemes.next([]);
					this.previousValue = input;
					this.linkCtrl.setValue(input, { emitEvent: false });
					*/
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
