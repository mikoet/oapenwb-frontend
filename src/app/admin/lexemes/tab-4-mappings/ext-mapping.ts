// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { ApiAction, Mapping, SememeSlim } from "@app/admin/_models/oapenwb-api";
import { transferValues } from "@app/admin/_util/form-utils";

export interface ThisThatMapping
{
	thisSememe: number;
	langPair: string;
	thatSememe: number;
	weight: number;
}

export class ExtMapping implements Mapping, ThisThatMapping
{
	id: number = null;
    version: number = null;
	creatorID: number;
    langPair: string = null;
    sememeOneID: number = null;
    sememeTwoID: number = null;
    sememeOne: SememeSlim = null;
    sememeTwo: SememeSlim = null;
    weight: number = null;
    changed: boolean = false;
	apiAction: ApiAction = 'None';

	private __twisted: boolean = false;
	set twisted(value: boolean) {
		this.__twisted = value;
	}

	get thisSememe() : number {
		return this.__twisted ? this.sememeTwoID : this.sememeOneID;
	}
	set thisSememe(value: number) {
		if (this.__twisted) {
			this.sememeTwoID = value;
		} else {
			this.sememeOneID = value;
		}
	}
	get thatSememe() : number {
		return this.__twisted ? this.sememeOneID : this.sememeTwoID;
	}
	set thatSememe(value: number) {
		if (this.__twisted) {
			this.sememeOneID = value;
		} else {
			this.sememeTwoID = value;
		}
	}

	constructor(twisted: boolean, mapping: Mapping)
	{
		this.__twisted = twisted;
		transferValues(mapping, this);
	}
}
