/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 2.32.889 on 2022-08-07 20:06:31.

export interface SearchRequest {
    pair: string;
    term: string;
    direction: Direction;
}

export interface SearchResult {
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
}

export type Direction = "Both" | "Left" | "Right";
