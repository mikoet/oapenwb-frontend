// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { EventEmitter } from "@angular/core";
import { Sememe } from "@app/admin/_models/oapenwb-api";

export interface SememeSupply
{
	// fires when a sememe is added
    addedEmitter: EventEmitter<Sememe>;
	// fires when a sememe is removed
	removedEmitter: EventEmitter<Sememe>;
	sememes: Sememe[];
	sememeNames: string[];
}
