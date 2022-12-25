/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 2.32.889 on 2022-12-24 14:42:52.

export interface ACSearchRequest {
    pair: string;
    term: string;
    direction: Direction;
    maxResults: number;
}

export interface ACSearchResult {
    entries: VariantEntry[];
}

export interface SearchRequest {
    pair: string;
    term: string;
    direction: Direction;
}

export interface SearchResult {
    entries: ResultCategory[];
}

export interface VariantEntry {
    typeID: number;
    lemma: string;
    searchWord: string;
    locale: string;
}

export interface ResultCategory {
    uitID: string;
    totalWeight: number;
    entries: ResultEntry[];
}

export interface ResultEntry {
    sememeOne: SememeEntry;
    sememeTwo: SememeEntry;
    weight: number;
}

export interface SememeEntry {
    typeID: number;
    lemma: string;
    locale?: string;
}

export type Direction = "Both" | "Left" | "Right";
