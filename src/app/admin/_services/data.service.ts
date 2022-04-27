// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, concat, EMPTY, merge, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Dictionary, KeyMap, NumericKeyMap } from '@app/util/hashmap';
import { environment } from '@environments/environment';
import { Category, LangOrthoMapping, LangPair, Language, LemmaTemplate, LexemeFormType, LexemeType, Orthography, Tag, TypeLanguageConfig, Level } from '../_models/oapenwb-api';
import { categoriesApiPath, langApiPath, langPairApiPath, lemmaTemplatesApiPath, lexemeFormTypeApiPath, lexemeTypeApiPath, loMappingApiPath, orthoApiPath, tagsApiPath, typeLangConfigsApiPath, unitLevelsApiPath } from '../_models/api-pathes';
import { Response } from '@app/_models/response';

export class ExtLanguage implements Language
{
	id: number;
	version: number;
	parentID: number;
	locale: string;
	localName: string;
	uitID: string;
	uitID_abbr: string;
	mainOrthographyID: number;

	_children?: ExtLanguage[];
	_orthographies?: Orthography[];
}

export class ExtCategory implements Category
{
	id: number;
	version: number;
	parentID: number;
	uitID_abbr: string;
	uitID: string;
	description: string;

	_children?: ExtCategory[];
}

export enum ErrorScope
{
    Initialisation,
	Reinitialisation
}

export class ErrorSet
{
	readonly scope: ErrorScope;
	readonly errors: string[];
	constructor(scope: ErrorScope, errors: string[])
	{
		this.scope = scope;
		this.errors = errors;
	}
}

export enum Entities
{
	Orthographies = 'orthographies',
	Languages = 'languages',
	LangOrthoMappings = 'langOrthoMappings',
	LangPairs = 'langPairs',
	LexemeTypes = 'lexemeTypes',
	LexemeFormTypes = 'lexemeFormTypes',
	TypeLangConfigs = 'typeLangConfigs',
	LemmaTemplates = 'lemmaTemplates',
	Tags = 'tags',
	Categories = 'categories',
	Levels = 'levels',
}

@Injectable()
export class DataService
{
	public readonly store: {
		allLanguages: NumericKeyMap<ExtLanguage>, // top languages and all dialects
		languages: NumericKeyMap<ExtLanguage>, // top languages only
		langPairs: KeyMap<LangPair>,
		orthographies: NumericKeyMap<Orthography>,
		lexemeTypes: NumericKeyMap<LexemeType>,
		lexemeTypesByName: KeyMap<LexemeType>
		lexemeFormTypes: NumericKeyMap<NumericKeyMap<LexemeFormType>>, // keys: typeID, lexemeFormTypeID
		typeLangConfigs: NumericKeyMap<NumericKeyMap<TypeLanguageConfig>>, // keys: typeID, langID (note: the typeLangConfigID is really not used as key)
		lemmaTemplates: NumericKeyMap<LemmaTemplate>,
		tags: KeyMap<Tag>,
		allCategories: NumericKeyMap<ExtCategory>,
		categories: NumericKeyMap<ExtCategory>,
		levels: NumericKeyMap<Level>
	} = {
		allLanguages: new NumericKeyMap(),
		languages: new NumericKeyMap(),
		langPairs: new KeyMap(),
		orthographies: new NumericKeyMap(),
		lexemeTypes: new NumericKeyMap(),
		lexemeTypesByName: new KeyMap(),
		lexemeFormTypes: new NumericKeyMap(),
		typeLangConfigs: new NumericKeyMap(),
		lemmaTemplates: new NumericKeyMap(),
		tags: new KeyMap(),
		allCategories: new NumericKeyMap(),
		categories: new NumericKeyMap(),
		levels: new NumericKeyMap()
	};

	private _loading = new BehaviorSubject<boolean>(false);
	readonly loading = this._loading.asObservable();

	private _errors = new BehaviorSubject<ErrorSet>(null);
	readonly errors = this._errors.asObservable();

	// Contains a map of top level languages which then contain their direct children layer for layer (dialects)
	private _languages = new BehaviorSubject<NumericKeyMap<ExtLanguage>>(new NumericKeyMap());
	readonly languages = this._languages.asObservable();

	private _langPairs = new BehaviorSubject<LangPair[]>([]);
	readonly langPairs = this._langPairs.asObservable();

	private _lexemeTypes = new BehaviorSubject<LexemeType[]>([]);
	readonly lexemeTypes = this._lexemeTypes.asObservable();

	private _lemmaTemplates = new BehaviorSubject<LemmaTemplate[]>([]);
	readonly lemmaTemplates = this._lemmaTemplates.asObservable();

	// Contains a map of arrays of LexemeFormTypes with the LexemeType ID as key of that map
	private _lexemeFormTypes = new BehaviorSubject<NumericKeyMap<NumericKeyMap<LexemeFormType>>>(new NumericKeyMap());
	readonly lexemeFormTypes = this._lexemeFormTypes.asObservable();

	private _typeLangConfigs = new BehaviorSubject<NumericKeyMap<NumericKeyMap<TypeLanguageConfig>>>(new NumericKeyMap());
	readonly typeLangConfigs = this._typeLangConfigs.asObservable();

	private _orthographies = new BehaviorSubject<Orthography[]>([]);
	readonly orthographies = this._orthographies.asObservable();

	private _tags = new BehaviorSubject<Tag[]>([]);
	readonly tags = this._tags.asObservable();

	private _categories = new BehaviorSubject<NumericKeyMap<ExtCategory>>(new NumericKeyMap());
	readonly categories = this._categories.asObservable();

	private _unitLevels = new BehaviorSubject<Level[]>([]);
	readonly unitLevels = this._unitLevels.asObservable();

	/*
	 * TODO
	 * link types
	*/

	constructor(private http: HttpClient) { }

	initialise() : void {
		this.reinitialiseSpecified(null);
		/*.subscribe(
			response => this.handleLanguageResponse(response),
			error => this.handleError(error, 'languages')
		);*/
	}

	/**
	 * Reinitialises the data that might change after a lexeme is saved.
	 */
	reinitialise() : void {
		let entities: KeyMap<void> = new KeyMap<void>().add(Entities.Tags);
		this.reinitialiseSpecified(entities);
	}

	/**
	 * This method does the real work.
	 * 
	 * @param entities If null, all entities will be (re)loaded. If not null, the keys specify which entities
	 * 		to reload (see class Entities).
	 */
	reinitialiseSpecified(entities: KeyMap<void>) : void {
		this._loading.next(true);
		let observables : Observable<void>[] = [];
		let errors: string[] = [];

		if (entities === null || entities.containsKey(Entities.Languages) || entities.containsKey(Entities.LangPairs)
			|| entities.containsKey(Entities.Orthographies) || entities.containsKey(Entities.LangOrthoMappings))
		{
			const languagesURL = `${environment.apiUrl}/admin/${langApiPath}/`;
			let langObservable = this.http.get<Response<ExtLanguage[]>>(languagesURL)
			.pipe(
				map((response: Response<ExtLanguage[]>) => this.handleLanguageResponse(response)),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'languages', errors))
			);

			const langPairsURL = `${environment.apiUrl}/admin/${langPairApiPath}/`;
			let langPairObservable = this.http.get<Response<LangPair[]>>(langPairsURL)
			.pipe(
				map((response: Response<LangPair[]>) => { 
					let langPairMap: KeyMap<LangPair> = new KeyMap();
					response.data.forEach(langPair => langPairMap.add(langPair.id, langPair));
					this.store.langPairs = langPairMap;
					this._langPairs.next(response.data);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'language pairs', errors))
			);

			const orthographiesURL = `${environment.apiUrl}/admin/${orthoApiPath}/`;
			let orthographiesObservable = this.http.get<Response<Orthography[]>>(orthographiesURL)
			.pipe(
				map((response: Response<Orthography[]>) => { 
					let orthoMap: NumericKeyMap<Orthography> = new NumericKeyMap();
					response.data.forEach(ortho => orthoMap.add(ortho.id, ortho));
					this.store.orthographies = orthoMap;
					this._orthographies.next(response.data);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'orthographies', errors))
			);

			const langOrthoMappingsURL = `${environment.apiUrl}/admin/${loMappingApiPath}/`;
			let langOrthoMappingsObservable = this.http.get<Response<LangOrthoMapping[]>>(langOrthoMappingsURL)
			.pipe(
				map((response: Response<LangOrthoMapping[]>) => {
					// the loMappings are not stored in an own property but assigned to the languages
					if (response.data) {
						for (let loMapping of response.data) {
							let language = this.store.allLanguages.get(loMapping.langID);
							let orthography = this.store.orthographies.get(loMapping.orthographyID);
							if (!language.hasOwnProperty('_orthographies')) {
								language._orthographies = []
							}
							language._orthographies.push(orthography);
						}
					}
				}),
				catchError((error: HttpErrorResponse) =>  this.handleError(error, 'language orthography mappings', errors))
			);
			// langOrthoMappingsObservable is depending on the results of the two stepOneObservables
			let stepOneObservable = merge(langObservable, orthographiesObservable);
			let stepTwoObservable = concat(stepOneObservable, langOrthoMappingsObservable, langPairObservable);
			observables.push(stepTwoObservable);
		}

		if (entities === null || entities.containsKey(Entities.LexemeTypes)) {
			const lexemeTypesURL = `${environment.apiUrl}/admin/${lexemeTypeApiPath}/`;
			let lexemeTypesObservable = this.http.get<Response<LexemeType[]>>(lexemeTypesURL)
			.pipe(
				map((response: Response<LexemeType[]>) => {
					let typeMap: NumericKeyMap<LexemeType> = new NumericKeyMap();
					let typeMapByNames: KeyMap<LexemeType> = new KeyMap();
					response.data.forEach(type => {
						typeMap.add(type.id, type)
						typeMapByNames.add(type.name, type);
					});
					this.store.lexemeTypes = typeMap;
					this.store.lexemeTypesByName = typeMapByNames;
					this._lexemeTypes.next(response.data);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'lexeme types', errors))
			);
			observables.push(lexemeTypesObservable);
		}

		if (entities === null || entities.containsKey(Entities.LexemeFormTypes)) {
			const lexemeFormTypesURL = `${environment.apiUrl}/admin/${lexemeFormTypeApiPath}/`;
			let lexemeFormTypesObservable = this.http.get<Response<LexemeFormType[]>>(lexemeFormTypesURL)
			.pipe(
				map((response: Response<LexemeFormType[]>) => this.handleFormTypesResponse(response)),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'lexeme form types', errors))
			);
			observables.push(lexemeFormTypesObservable);
		}

		if (entities === null || entities.containsKey(Entities.TypeLangConfigs)) {
			const typeLangConfigsURL = `${environment.apiUrl}/admin/${typeLangConfigsApiPath}/`;
			let typeLangConfigsObservable = this.http.get<Response<TypeLanguageConfig[]>>(typeLangConfigsURL)
			.pipe(
				map((response: Response<TypeLanguageConfig[]>) => this.handleTypeLangConfigs(response)),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'lexeme form types', errors))
			);
			observables.push(typeLangConfigsObservable);
		}

		if (entities === null || entities.containsKey(Entities.LemmaTemplates)) {
			const lemmaTemplatesURL = `${environment.apiUrl}/admin/${lemmaTemplatesApiPath}/`;
			let lemmaTemplatesObservable = this.http.get<Response<LemmaTemplate[]>>(lemmaTemplatesURL)
			.pipe(
				map((response: Response<LemmaTemplate[]>) => {
					let templateMap: NumericKeyMap<LemmaTemplate> = new NumericKeyMap();
					response.data.forEach(template => templateMap.add(template.id, template));
					this.store.lemmaTemplates = templateMap;
					this._lemmaTemplates.next(response.data);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'lemma templates', errors))
			);
			observables.push(lemmaTemplatesObservable);
		}

		if (entities === null || entities.containsKey(Entities.Tags)) {
			const tagsURL = `${environment.apiUrl}/admin/${tagsApiPath}/`;
			let tagsObservable = this.http.get<Response<Tag[]>>(tagsURL)
			.pipe(
				map((response: Response<Tag[]>) => {
					let tagMap: KeyMap<Tag> = new KeyMap();
					response.data.forEach(entity => tagMap.add(entity.tag, entity));
					this.store.tags = tagMap;
					this._tags.next(response.data);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'tags', errors))
			);
			observables.push(tagsObservable);
		}

		if (entities === null || entities.containsKey(Entities.Categories)) {
			const categoriesURL = `${environment.apiUrl}/admin/${categoriesApiPath}/`;
			let categoriesObservable = this.http.get<Response<Category[]>>(categoriesURL)
			.pipe(
				map((response: Response<Category[]>) => this.handleCategoryResponse(response)),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'categories', errors))
			);
			observables.push(categoriesObservable);
		}

		if (entities === null || entities.containsKey(Entities.Levels)) {
			const unitLevelsURL = `${environment.apiUrl}/admin/${unitLevelsApiPath}/`;
			let unitLevelsObservable = this.http.get<Response<Level[]>>(unitLevelsURL)
			.pipe(
				map((response: Response<Level[]>) => { 
					let entityMap: NumericKeyMap<Level> = new NumericKeyMap();
					response.data.forEach(entity => entityMap.add(entity.id, entity));
					this.store.levels = entityMap;
					this._unitLevels.next(response.data);
				}),
				catchError((error: HttpErrorResponse) => this.handleError(error, 'unit levels', errors))
			);
			observables.push(unitLevelsObservable);
		}

		merge(...observables)
		.subscribe(
			response => {
				this._loading.next(false);
				if (errors.length > 0) {
					this._errors.next(new ErrorSet(ErrorScope.Initialisation, errors));
				}
			},
			error => {
				this._loading.next(false);
			}
		);
	}

	private handleError(error: HttpErrorResponse, topic: string, errors: string[]) {
		if (error.error instanceof ErrorEvent) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error('An error occurred when loading ' + topic + ':', error);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong,
			console.error(`An error occurred when loading ${topic}. ` +
				`Backend returned code ${error.status}, ` +
				`body was: `, error.error);
		}
		errors.push(`Loading of ${topic} failed.`);
		// return an observable with a user-facing error message
		//return throwError('We\'re sorry. There is a technical problem.');

		// If you want to return a new response:
        //return of(new HttpResponse({body: [{name: "Default value..."}]}));

        // If you want to return the error on the upper level:
        //return throwError(error);
		return EMPTY;
	};

	private handleLanguageResponse(response: Response<ExtLanguage[]>) : void {
		let allLanguageMap: NumericKeyMap<ExtLanguage> = new NumericKeyMap();
		let languageMap: NumericKeyMap<ExtLanguage> = new NumericKeyMap();
		let languageDict: Dictionary<ExtLanguage> = {};
		let remainingLanguages: ExtLanguage[] = response.data;
		while (remainingLanguages.length > 0) {
			let languages = remainingLanguages.slice();
			remainingLanguages = [];
			for (let language of languages) {
				let id = language.id;
				let parentID = language.parentID;
				// Add to the dictionary
				languageDict[id] = language;
				if (parentID === null) {
					// Top level language will be added to the languageMap
					languageMap.add(id, language);
				} else {
					// the others are dialects and will be added as children to their parents
					// (via the languageDict)
					if (languageDict.hasOwnProperty(parentID)) {
						if (!languageDict[parentID].hasOwnProperty('_children')) {
							languageDict[parentID]._children = [];
						}
						languageDict[parentID]._children.push(language);
					} else {
						// this language must be re-handled in next round since the parent is not yet part of
						// the languageDict
						remainingLanguages.push(language);
					}
				}
				// if not yet in allLanguageMap put the language in there
				if (!allLanguageMap.containsKey(id)) {
					allLanguageMap.add(id, language);
				}
			}
		}
		// Done. Propagate the languageMap.
		this.store.allLanguages = allLanguageMap;
		this.store.languages = languageMap;
		this._languages.next(languageMap);
	}

	private handleFormTypesResponse(response: Response<LexemeFormType[]>) : void {
		let formTypeMap: NumericKeyMap<NumericKeyMap<LexemeFormType>> = new NumericKeyMap();
		// Lexeme form types will be added to the map with their typeID as key
		for (let formType of response.data) {
			let formTypes = formTypeMap.get(formType.lexemeTypeID);
			if (formTypes === null) {
				formTypes = new NumericKeyMap();
				formTypeMap.add(formType.lexemeTypeID, formTypes);
			}
			formTypes.add(formType.id, formType);
		}
		// Done. Propagate the formTypeMap.
		this.store.lexemeFormTypes = formTypeMap;
		this._lexemeFormTypes.next(formTypeMap);
	}

	private handleTypeLangConfigs(response: Response<TypeLanguageConfig[]>) : void {
		let typeLangConfigsMap: NumericKeyMap<NumericKeyMap<TypeLanguageConfig>> = new NumericKeyMap();
		// key of outer map: lexemeTypeID, key of inner sub maps: langID (!)
		for (let typeLangConfig of response.data) {
			let subMap = typeLangConfigsMap.get(typeLangConfig.lexemeTypeID);
			if (subMap === null) {
				subMap = new NumericKeyMap();
				typeLangConfigsMap.add(typeLangConfig.lexemeTypeID, subMap);
			}
			subMap.add(typeLangConfig.langID, typeLangConfig);
		}
		// Done. Propagate the typeLangConfigsMap.
		this.store.typeLangConfigs = typeLangConfigsMap;
		this._typeLangConfigs.next(typeLangConfigsMap);
	}

	// TODO this code is a copy of handleLanguageResponse. Can we not generalise it?
	private handleCategoryResponse(response: Response<Category[]>) { 
		let allCategoriesMap: NumericKeyMap<ExtCategory> = new NumericKeyMap();
		let categoriesMap: NumericKeyMap<ExtCategory> = new NumericKeyMap();
		let categoryDict: Dictionary<ExtCategory> = {};
		let remainingCategories: ExtCategory[] = response.data;
		while (remainingCategories.length > 0) {
			let categories = remainingCategories.slice();
			remainingCategories = [];
			for (let category of categories) {
				let id = category.id;
				let parentID = category.parentID;
				// Add to the dictionary
				categoryDict[id] = category;
				if (parentID === null) {
					// Top level category will be added to the categoriesMap
					categoriesMap.add(id, category);
				} else {
					// the others will be added as children to their parents
					// (via the categoryDict)
					if (categoryDict.hasOwnProperty(parentID)) {
						if (!categoryDict[parentID].hasOwnProperty('_children')) {
							categoryDict[parentID]._children = [];
						}
						categoryDict[parentID]._children.push(category);
					} else {
						// this category must be re-handled in next round since the parent is not yet part of
						// the categoryDict
						remainingCategories.push(category);
					}
				}
				// if not yet in allCategoriesMap put the category in there
				if (!allCategoriesMap.containsKey(id)) {
					allCategoriesMap.add(id, category);
				}
			}
		}
		// Done. Propagate the categoriesMap.
		this.store.allCategories = allCategoriesMap;
		this.store.categories = categoriesMap;
		this._categories.next(categoriesMap);
	}
}