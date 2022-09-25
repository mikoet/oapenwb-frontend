/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 2.32.889 on 2022-09-24 19:53:48.

export interface SearchRequest {
    pair: string;
    term: string;
    direction: Direction;
}

export interface SearchResult {
    entries: ResultCategory[];
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
