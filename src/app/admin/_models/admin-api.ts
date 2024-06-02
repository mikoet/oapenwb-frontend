/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 2.32.889 on 2024-06-02 22:40:26.

export interface LSearchRequest {
    filter: string;
    textSearchType?: TextSearchType;
    offset: number;
    limit: number;
    options: FilterOptions;
}

export interface FilterOptions {
    langIDs: number[];
    typeIDs: number[];
    tags: string[];
    state: State;
}

export interface LexemeSlimDTO {
    id: number;
    parserID: string;
    typeID: number;
    langID: number;
    pre: string;
    main: string;
    post: string;
    active: boolean;
    condition: number;
    tags: string[];
    firstSememeID: number;
}

export interface LexemeDetailedDTO {
    lexeme: Lexeme;
    variants: Variant[];
    sememes: Sememe[];
    links: Link[];
    mappings: Mapping[];
}

export interface SSearchRequest {
    filter: string;
    textSearchType?: TextSearchType;
    langID: number;
    typeID?: number;
}

export interface SSearchResult {
    lexemes: LexemeSlimPlus[];
}

export interface LexemeSlimPlus extends LexemeSlimDTO {
    sememes: Sememe[];
}

export interface SememeSlim {
    id: number;
    internalName: string;
    active: boolean;
    spec: string;
    lexemeID: number;
    typeID: number;
    langID: number;
    lexActive: boolean;
    pre: string;
    main: string;
    post: string;
}

export interface SGSearchRequest {
    filter: string;
    textSearchType?: TextSearchType;
    langID: number;
    typeID?: number;
}

export interface SGSearchResult {
    synGroups: SynGroupItem[];
    lexemes: LexemeSlimPlus[];
}

export interface SynGroupItem {
    id: number;
    description: string;
    presentation: string;
}

export interface Language extends IEntity<number> {
    id: number;
    version: number;
    parentID: number;
    localName: string;
    locale: string;
    uitID: string;
    uitID_abbr: string;
    mainOrthographyID: number;
    importAbbreviation: string;
}

export interface LangOrthoMapping extends IEntity<number> {
    id: number;
    version: number;
    langID: number;
    orthographyID: number;
    position: number;
}

export interface LangPair extends IEntity<string> {
    id: string;
    version: number;
    langOneID: number;
    langTwoID: number;
    position: number;
}

export interface Orthography extends IEntity<number> {
    id: number;
    version: number;
    parentID: number;
    uitID: string;
    abbreviation: string;
    description: string;
    publicly: boolean;
}

export interface LexemeType extends IEntity<number> {
    id: number;
    version: number;
    name: string;
    uiCategoryID: number;
    uitID: string;
}

export interface LexemeFormType extends IEntity<number>, Serializable {
    id: number;
    version: number;
    lexemeTypeID: number;
    name: string;
    uitID: string;
    description: string;
    mandatory: boolean;
    position: number;
}

export interface FormTypePos {
    formTypeID: number;
    position: number;
}

export interface TypeLanguageConfig extends IEntity<number> {
    id: number;
    version: number;
    lexemeTypeID: number;
    langID: number;
    formTypePositions: FormTypePos[];
}

export interface LemmaTemplate extends IEntity<number> {
    id: number;
    version: number;
    name: string;
    lexemeTypeID: number;
    langID: number;
    dialectIDs: number[];
    orthographyID: number;
    preText: string;
    mainText: string;
    postText: string;
    alsoText: string;
}

export interface Category extends IEntity<number> {
    id: number;
    version: number;
    parentID: number;
    uitID: string;
    uitID_abbr: string;
    description: string;
}

export interface Level extends IEntity<number> {
    id: number;
    version: number;
    uitID: string;
    uitID_abbr: string;
    description: string;
}

export interface Lexeme extends IRPCEntity<number> {
    id: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    creatorID: number;
    langID: number;
    typeID: number;
    parserID: string;
    tags: string[];
    notes: string;
    showVariantsFrom: number;
    properties: { [index: string]: any };
    active: boolean;
    changed: boolean;
}

export interface Variant extends IRPCEntity<number>, Cloneable {
    id: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    creatorID: number;
    lexemeID: number;
    mainVariant: boolean;
    dialectIDs: number[];
    orthographyID: number;
    lexemeForms: LexemeForm[];
    lemma: Lemma;
    metaInfos: MetaInfo[];
    properties: { [index: string]: any };
    active: boolean;
    changed: boolean;
}

export interface Sememe extends IRPCEntity<number>, IEntity<number> {
    id: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    creatorID: number;
    lexemeID: number;
    internalName: string;
    variantIDs: number[];
    dialectIDs: number[];
    levelIDs: number[];
    categoryIDs: number[];
    fillSpec: number;
    specTemplate: string;
    spec: string;
    properties: { [index: string]: any };
    active: boolean;
    changed: boolean;
    synGroupID: number;
    synGroup: SynGroup;
}

export interface Tag extends IEntity<string> {
    tag: string;
    version: number;
    usageCount: number;
    guarded: boolean;
}

export interface LexemeForm extends Serializable {
    variantID: number;
    formTypeID: number;
    state: number;
    text: string;
}

export interface Link extends IRPCEntity<number> {
    id: number;
    version: number;
    creatorID: number;
    typeID: number;
    startSememeID: number;
    endSememeID: number;
    changed: boolean;
}

export interface Mapping extends IRPCEntity<number> {
    id: number;
    version: number;
    creatorID: number;
    langPair: string;
    sememeOneID: number;
    sememeTwoID: number;
    sememeOne: SememeSlim;
    sememeTwo: SememeSlim;
    weight: number;
    changed: boolean;
}

export interface MetaInfo extends Serializable {
    ident: string;
    value: string;
}

export interface UiLanguage extends IEntity<string> {
    locale: string;
    version: number;
    localName: string;
    isDefault: boolean;
    active: boolean;
}

export interface UiResultCategory extends IEntity<number> {
    id: number;
    version: number;
    name: string;
    uitID: string;
    position: number;
}

export interface UiTranslationScope extends IEntity<string> {
    id: string;
    version: number;
    description: string;
    essential: boolean;
}

export interface UiTranslationSet extends IEntity<string> {
    uitID: string;
    scopeID: string;
    essential: boolean;
    translations: { [index: string]: string };
}

export interface Serializable {
}

export interface Lemma extends Cloneable {
    pre: string;
    main: string;
    post: string;
    also: string;
    fillLemma: number;
}

export interface Cloneable {
}

export interface SynGroup extends IRPCEntity<number>, IEntity<number> {
    id: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    creatorID: number;
    sememeIDs: number[];
    presentation: string;
    description: string;
    changed: boolean;
}

export interface IEntity<T> {
}

export interface IRPCEntity<T> {
    apiAction: ApiAction;
    id: T;
}

export type TextSearchType = "PostgreWeb" | "Prefixed";

export type State = "Active" | "Inactive" | "Both";

export type ApiAction = "None" | "Insert" | "Update" | "Delete";
