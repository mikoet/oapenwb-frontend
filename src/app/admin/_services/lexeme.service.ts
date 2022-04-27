// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of as observableOf } from 'rxjs';
import { catchError, first, map } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';

import { AccountService } from '@app/shared/_services/account.service';

import { LexemeQueryService } from './lexeme-query.service';
import { LexemeDetailedDTO, LexemeSlimDTO, Mapping, Sememe, Variant } from '../_models/oapenwb-api';
import { ApiAction } from '../_models/enums';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { lexemesApiPath } from '../_models/api-pathes';
import { MultiResponse } from '@app/_models/response';
import { Message } from '@app/_models/message';
import { DataService } from './data.service';
import { SememeService } from './sememe.service';

export const TOPLIST_MAX_ENTRIES: number = 5;
export const FILL_LEMMA_DEFAULT: number = -2;

export enum LexemeOrigin
{
	TopList = 1,
	LexemeList = 2
}

export class SelectedLexeme
{
	origin: LexemeOrigin;
	index?: number;
	id?: number;
}

export class HeldLexeme
{
	slim: LexemeSlimDTO;
	detailed: LexemeDetailedDTO;
	persistent: boolean;
	decoupled: boolean;
	changed: boolean;
	errorCount: number;
	messages?: Message[];
}

export class SnackMessage
{
	uitID: string; // including scope
	arguments?: object[];
}

/**
 * The LexemeService holds the active lexeme that is being edited.
 */
@Injectable()
export class LexemeService
{
	public readonly store : {
		heldLexemes: HeldLexeme[],
		active: SelectedLexeme
	} = {
		heldLexemes: [],
		active: null
	};

	private newLexemeCount: number = 1;
	private _unpersistentCount: number = 0;
	private _persistentCount: number = 0;

	private nextVariantID: number = -1;
	private nextMappingID: number = -1;

	private _heldLexemes = new BehaviorSubject<HeldLexeme[]>([]);
	readonly heldLexemes = this._heldLexemes.asObservable();

	private _activeLexeme = new BehaviorSubject<SelectedLexeme>(null);
	readonly activeLexeme = this._activeLexeme.asObservable();

	/* emitted when the error count of the active lexeme has changed so the view
	 * can make a change detection.
	 * TODO Should be renamed to activeDataChange or something like that.
	 */
	private _errorChange = new BehaviorSubject<number>(null);
	readonly errorChange = this._errorChange.asObservable();

	private _snackMessage = new BehaviorSubject<SnackMessage>(null);
	readonly snackMessage = this._snackMessage.asObservable();

	/*
	private _errors = new BehaviorSubject<ErrorSet>(null);
	readonly errors = this._errors.asObservable();
	*/
	
	//private queryService: LexemeQueryService;
	constructor(/*injector: Injector,*/ private http: HttpClient, private readonly queryService: LexemeQueryService,
		private readonly dataService: DataService, private readonly sememeService: SememeService,
		private readonly transloco: TranslocoService, private readonly accountService: AccountService)
	{
		//setTimeout(() => this.queryService = injector.get(LexemeQueryService));
		accountService.registerActionHook("LexemeService", action => {
			if (action == 'Logout') {
				console.log('Logout in LexemeService');
				this.store.heldLexemes = [];
				this.store.active = null;

				this.newLexemeCount = 1;
				this._unpersistentCount = 0;
				this._persistentCount = 0;

				this._heldLexemes.next(this.store.heldLexemes);
				this._activeLexeme.next(this.store.active);

				this._errorChange.next(0);
				this._snackMessage.next(null);
			}
		});
	}

	public getActiveLexeme() : Observable<LexemeDetailedDTO>
	{
		let result = null;
		let active = this.store.active;
		if (active !== null) {
			if (active.origin === LexemeOrigin.TopList) {
				result = new Observable<LexemeDetailedDTO>(observer => {
					let foundLexeme: LexemeDetailedDTO = null;
					for (let i = 0; i < this.store.heldLexemes.length; i++) {
						if (i === active.index) {
							foundLexeme = this.store.heldLexemes[i].detailed;
						}
					}
					observer.next(foundLexeme);
				});
			} else if (active.origin === LexemeOrigin.LexemeList) {
				result = this.queryService.loadByID(active.id);
			}
		} else {
			result = new Observable<LexemeDetailedDTO>(observer => {
				observer.next(null);
			});
		}
		return result.pipe(first());
	}

	/**
	 * Can be used to find out if the questioned lexeme is currently being edited,
	 * i.e. it in the list of the held lexemes.
	 * However, this method must only be called for persistent lexemes.
	 * 
	 * @param questioned 
	 * @returns 
	 */
	public isBeingEdited(questioned: SelectedLexeme) : boolean
	{
		if (this._persistentCount > 0) {
			for (let lexeme of this.store.heldLexemes) {
				if (lexeme.persistent && lexeme.slim.id === questioned?.id && !lexeme.decoupled) {
					return true;
				}
			}
		}
		return false;
	}

	public writeToActiveLexeme(section: string, source: object, trackChangedAndErrors: boolean = false) : void
	{
		// Only write into lexemes that are in the TopList
		if (this.store.active.origin === LexemeOrigin.TopList) {
			let lexemeDTO = this.store.heldLexemes[this.store.active.index].detailed;

			if (Array.isArray(source) && Array.isArray(lexemeDTO[section])) {
				// When the section is an array it has to be directly assigned to the section of the lexemeDTO
				//lexemeDTO[section] = source;
				lexemeDTO[section] = [...source];
			} else {
				let target = lexemeDTO[section];
				// Check if the desired section exists as target
				if (target !== null && target !== undefined) {
					Object.keys(target).forEach(key => {
						if (source[key] !== undefined) {
							target[key] = source[key];
						}
					});
				}
			}
			if (trackChangedAndErrors) {
				this.trackChangedAndErrorsHook(/*section*/);
			}
		}
	}

	/**
	 * This method is a little costy, or maybe not (never measured it).
	 * I just don't like the idea that when e.g. mappings are written everything
	 * will be tracked.
	 * My first optimization to track by section was foolish because then error counting (in total errors)
	 * as well as 'heldLexeme.changed = changed;' did not work.
	 */
	private trackChangedAndErrorsHook(/*section: string*/) {
		if (this.store.active.origin === LexemeOrigin.TopList) {
			let heldLexeme = this.store.heldLexemes[this.store.active.index];
			let lexemeDTO = heldLexeme.detailed;
			let changed: boolean = false;
			let errorCount: number = 0;

			//if (section == 'variants') {
			// check changed and count errors for the variants
			for (let variant of lexemeDTO.variants) {
				changed = variant.changed ? true : changed;
				let varEC = variant['__errorCount'];
				if (!!varEC) {
					// if __errorCount was defined it will be counted
					errorCount += varEC;
				}
			}
			//}

			//if (section == 'sememes') {
			// check changed and count errors for the sememes
			for (let sememe of lexemeDTO.sememes) {
				changed = sememe.changed ? true : changed;
				let semEC = sememe['__errorCount'];
				if (!!semEC) {
					// if __errorCount was defined it will be counted
					errorCount += semEC;
				}
				if (!!sememe.synGroup) {
					changed = sememe.synGroup.changed ? true : changed;
					// No error counting for SynGroups as of now.
				}
			}
			//}

			//if (section == 'mappings') {
			// check changed flag on mappings (no error count here yet)
			for (let mapping of lexemeDTO.mappings) {
				changed = mapping.changed ? true : changed;
			}
			//}

			// TODO Links

			// check changed and count errors for the lexeme itself
			changed = lexemeDTO.lexeme.changed ? true : changed;
			let lexemeEC = lexemeDTO.lexeme['__errorCount'];
			if (lexemeEC) {
				errorCount += lexemeEC;
			}

			// Put the values into the held lexeme
			let emit = changed !== heldLexeme.changed || errorCount !== heldLexeme.errorCount;
			heldLexeme.changed = changed;
			heldLexeme.errorCount = errorCount;

			if (emit) {
				this._errorChange.next(errorCount);
			}
		}
	}

	public updateSlimLexeme() : void
	{
		// Only do that when the active lexeme is a top list lexeme
		if (this.store.active.origin === LexemeOrigin.TopList) {
			let held = this.store.heldLexemes[this.store.active.index];
			let detailed = held.detailed;
			let slim = held.slim;
			let copyOfNewName = slim.main;
			// Take some data from the lexeme itself
			slim.parserID = detailed.lexeme.parserID;
			slim.typeID = detailed.lexeme.typeID;
			slim.langID = detailed.lexeme.langID;
			slim.active = detailed.lexeme.active;
			slim.tags = Object.assign([], detailed.lexeme.tags);
			// Find the main variant and take some other data from it
			let mainVariant: Variant = undefined;
			for (let variant of detailed.variants) {
				if (variant.mainVariant) {
					mainVariant = variant;
					break;
				}
			}
			if (!!mainVariant) {
				slim.pre = mainVariant.lemma?.pre;
				slim.main = mainVariant.lemma?.main;
				slim.post = mainVariant.lemma?.post;
				// Find the first set text for a lexeme form of the main lexeme
				if (!slim.main && mainVariant.lexemeForms?.length > 0) {
					for (let form of mainVariant.lexemeForms) {
						if (form && form.text) {
							slim.main = form.text;
							break;
						}
					}
				}
			}

			if (!slim.main) {
				slim.main = copyOfNewName; // keep the "New XY" if nothing else was set
			}
		}
	}

	/**
	 * To be called when a lexeme is selected in the ListComponent.
	 * @param lexeme 
	 */
	public activateLexeme(lexeme: SelectedLexeme) : void
	{
		if (lexeme === null)
		{
			this.store.active = null;
			this._activeLexeme.next(null);
		}
		else if (lexeme.origin !== this.store.active?.origin || lexeme.index !== this.store.active?.index
			|| lexeme.id !== this.store.active?.id)
		{
			this.store.active = lexeme;
			this._activeLexeme.next(lexeme);
		}
	}

	public canCreateLexeme() : boolean
	{
		return (this._unpersistentCount + this._persistentCount) < TOPLIST_MAX_ENTRIES;
	}

	public createLexeme() : void
	{
		if (!this.canCreateLexeme()) {
			return;
		}
		let variant = this.createVariant(true);
		let sememe = this.sememeService.createSememe();
		// Auto-set the variant ID of the auto-created variant
		//sememe.variantIDs = [ variant.id ];

		// Create the new lexeme
		let lexeme: LexemeDetailedDTO = {
			// TODO Auslagern in eine createEmptyLexeme-Methode??
			lexeme: {
				id: null,
				createdAt: null,
				updatedAt: null,
				version: null,
				creatorID: null, // will be set by the backend no matter what
				langID: null,
				typeID: null,
				parserID: null,
				tags: [],
				notes: null,
				showVariantsFrom: null,
				properties: null,
				active: false,
				apiAction: ApiAction.Insert,
				changed: false
			},
			variants: [
				variant
			],
			sememes: [
				sememe
			],
			links: [],
			mappings: []
		};
		// Add two additional attributes for error counting on the lexeme
		lexeme.lexeme['__errorCount'] = 0;
		let lexemeSlim: LexemeSlimDTO = <LexemeSlimDTO>{
			main: this.transloco.translate('admin.new') + ' ' + this.newLexemeCount++
		};
		// Add the newly created lexeme to the store
		this.store.heldLexemes.push({
			slim: lexemeSlim,
			detailed: lexeme,
			persistent: false,
			decoupled: false,
			changed: false,
			errorCount: 0
		});
		this._unpersistentCount++;
		// Select the newly created lexeme
		this.store.active = { origin: LexemeOrigin.TopList, index: this.store.heldLexemes.length-1 };
		// Emit the changes
		this._heldLexemes.next(this.store.heldLexemes);
		this._activeLexeme.next(this.store.active);
	}

	public canEditLexeme() : boolean
	{
		return this.canCreateLexeme() && !this.isBeingEdited(this.store.active)
			&& this.store.active?.origin === LexemeOrigin.LexemeList;
	}

	public editLexeme() : void
	{
		if (this.canCreateLexeme() && !this.isBeingEdited(this.store.active)
			&& this.store.active?.origin === LexemeOrigin.LexemeList)
		{
			const id = this.store.active.id;
			const slimDTO = this.queryService.getSlimDTO(id);
			this.queryService.loadByID(id).subscribe(detailedDTO => {
				let heldLexeme: HeldLexeme = {
					slim: slimDTO,
					detailed: detailedDTO,
					persistent: true,
					decoupled: false,
					changed: false,
					errorCount: 0
				};
				this.store.heldLexemes.push(heldLexeme);
				this._persistentCount++;
				this.store.active = { origin: LexemeOrigin.TopList, index: this.store.heldLexemes.length-1 };
				// Emit changes
				this._heldLexemes.next(this.store.heldLexemes);
				this._activeLexeme.next(this.store.active);
			});
		}
	}

	public canSaveActiveLexeme() : boolean
	{
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			let heldLexeme = this.store.heldLexemes[this.store.active.index];
			return heldLexeme.changed && heldLexeme.errorCount === 0 && !heldLexeme.decoupled;
		}
		return false;
	}

	public saveActiveLexeme() : void
	{
		//if (this.canSaveActiveLexeme()) {
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			let index = this.store.active.index;
			let heldLexeme = this.store.heldLexemes[index];

			if (!heldLexeme.changed || heldLexeme.errorCount > 0 || heldLexeme.decoupled) {
				return;
			}

			// Save the lexeme

			// Remove additional property __errorCount (in each: lexeme, variant and sememe)
			let lexeme = heldLexeme.detailed.lexeme;
			Object.keys(lexeme).forEach(key => {
				if (key === '__errorCount') {
					delete lexeme['__errorCount'];
				}
			});
			for (let variant of heldLexeme.detailed.variants) {
				Object.keys(variant).forEach(key => {
					if (key === '__errorCount') {
						delete variant['__errorCount'];
					}
				});
			}
			for (let sememe of heldLexeme.detailed.sememes) {
				Object.keys(sememe).forEach(key => {
					if (key === '__errorCount') {
						delete sememe['__errorCount'];
					}
				});
			}
			for (let mapping of heldLexeme.detailed.mappings) {
				Object.keys(mapping).forEach(key => {
					if (key === '__twisted') {
						delete mapping['__twisted'];
					}
				});
			}
			
			const switchPersistent: boolean = !heldLexeme?.persistent;
			const requestUrl = `${environment.apiUrl}/admin/${lexemesApiPath}/`;
			let request: Observable<MultiResponse<LexemeSlimDTO>>;
			if (!heldLexeme?.persistent) {
				// Create
				request = this.http.post<MultiResponse<LexemeSlimDTO>>(requestUrl, heldLexeme.detailed);
			} else {
				// Update
				let lexemeID = heldLexeme.detailed.lexeme.id;
				request = this.http.put<MultiResponse<LexemeSlimDTO>>(`${requestUrl}${lexemeID}`, heldLexeme.detailed);
			}
			//this.http.put(this.restUrl + restApiUrl, data).pipe(share());
			request.pipe(
				map((response: MultiResponse<LexemeSlimDTO>) => {
					if (response.status === 'success') {
						return response.data;
					} else {
						heldLexeme.messages = response.messages;
						throw new Error('Saving lexeme failed.');
					}
				}),
				catchError(() => {
					this._snackMessage.next({
						uitID: 'admin.msg:lexemeNotSaved'
					});
					this._snackMessage.next(null);
					this._activeLexeme.next(this.store.active); // düt skul ni nöydig wean
					return observableOf(null);
				})
			).subscribe((slimDTO: LexemeSlimDTO) => {
				if (slimDTO) {
					// Reload the tags for the case they were changed
					this.dataService.reinitialise();

					heldLexeme.messages = null;
					this._snackMessage.next({
						uitID: 'admin.msg:lexemeSaved'
					});
					this._snackMessage.next(null);
					this.store.active.id = slimDTO.id;
					this.store.heldLexemes[this.store.active.index].slim = slimDTO;
					if (switchPersistent) {
						this._unpersistentCount--;
						this._persistentCount++;
					}
					this.reloadActiveLexeme();
				}
			});
		} else {
			this._activeLexeme.next(null);
			this._activeLexeme.next(this.store.active);
		}
	}

	private reloadActiveLexeme() : void
	{
		const id = this.store.active.id;
		const slimDTO = this.store.heldLexemes[this.store.active.index].slim;
		this.queryService.loadByID(id).subscribe(detailedDTO => {
			let heldLexeme: HeldLexeme = {
				slim: slimDTO,
				detailed: detailedDTO,
				persistent: true,
				decoupled: false,
				changed: false,
				errorCount: 0
			};
			this.store.heldLexemes[this.store.active.index] = heldLexeme;
			this.store.active = { origin: LexemeOrigin.TopList, index: this.store.heldLexemes.length-1 };
			// Emit changes
			this._heldLexemes.next(this.store.heldLexemes);
			this._activeLexeme.next(this.store.active);
		});
	}

	public canDiscardActiveLexeme() : boolean
	{
		return this.store.active?.origin === LexemeOrigin.TopList;
	}

	public discardActiveLexeme() : void
	{
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			// Remove the active lexeme
			let index = this.store.active.index;
			let lexeme = this.store.heldLexemes[index];
			this.store.heldLexemes.splice(index, 1);
			if (lexeme.persistent) {
				this._persistentCount--;
			} else {
				this._unpersistentCount--;
			}
			// Set the new active lexeme
			let storeSize = this.store.heldLexemes.length;
			if (storeSize > index) {
				this.store.active = { origin: LexemeOrigin.TopList, index: index };
			} else if (storeSize > 0 && storeSize === index) {
				this.store.active = { origin: LexemeOrigin.TopList, index: index-1 };
			} else if (storeSize > 0) {
				this.store.active = { origin: LexemeOrigin.TopList, index: 0 };
			} else {
				this.store.active = null;
			}
			// Emit the changes
			this._activeLexeme.next(this.store.active);
			this._heldLexemes.next(this.store.heldLexemes);
		}
	}

	public canDecoupleActiveLexeme() : boolean
	{
		if (this.hasActiveLexemeErrors()) {
			if (this.store.active?.origin === LexemeOrigin.TopList) {
				let heldLexeme = this.store.heldLexemes[this.store.active.index];
				return !heldLexeme.decoupled;
			}
		}
		return false;
	}

	public decoupleActiveLexeme() : void
	{
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			// Decouple the active lexeme
			let index = this.store.active.index;
			let lexeme = this.store.heldLexemes[index];
			lexeme.decoupled = true;
			// Emit the changes
			this._activeLexeme.next(this.store.active);
		}
	}

	public hasActiveLexemeErrors() : boolean
	{
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			let heldLexeme = this.store.heldLexemes[this.store.active.index];
			return heldLexeme.messages?.length > 0;
		}
		return false;
	}

	public getActiveLexemeErrors() : Message[]
	{
		if (this.hasActiveLexemeErrors()) {
			let heldLexeme = this.store.heldLexemes[this.store.active.index];
			return heldLexeme.messages;
		}
		return [];
	}

	public isActiveLexemePersistent() : boolean
	{
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			let heldLexeme = this.store.heldLexemes[this.store.active.index];
			return heldLexeme.persistent;
		}
		return false;
	}

	public isActiveLexemeChanged() : boolean
	{
		if (this.store.active?.origin === LexemeOrigin.TopList) {
			let index = this.store.active.index;
			let held = this.store.heldLexemes[index];
			return held?.changed;
		}
		return false;
	}

	public createVariant(mainVariant: boolean) : Variant
	{
		// Create the new variant
		let variant: Variant = {
			id: this.nextVariantID--,
			createdAt: null,
			updatedAt: null,
			version: null,
			creatorID: null, // will be set by the backend no matter what
			metaInfos: null,
			properties: null,

			dialectIDs: null,
			orthographyID: null,
			lexemeForms: [],

			// Presentation
			lemma: {
				pre: null,
				main: '',
				post: null,
				also: null,
				fillLemma: FILL_LEMMA_DEFAULT
			},

			mainVariant: mainVariant,
			lexemeID: null, // TODO this could be set to the ID of the active lexeme (when it's a top lexeme)
			active: true,
			apiAction: ApiAction.Insert,
			changed: false
		};
		return variant;
	}

	public createMapping() : Mapping
	{
		let mapping: Mapping = {
			id: this.nextMappingID--,
			version: null,
			creatorID: null, // Will be set by the backend
			langPair: null,
			sememeOneID: null,
			sememeTwoID: null,
			sememeOne: null,
			sememeTwo: null,
			weight: null,
			changed: false,
			apiAction: ApiAction.Insert
		}
		return mapping;
	}
}