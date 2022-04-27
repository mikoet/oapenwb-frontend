// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { EventEmitter } from "@angular/core";
import { Variant } from "@app/admin/_models/oapenwb-api";

export interface VariantSupply
{
	// fires when a variant is added
    addedEmitter: EventEmitter<Variant>;
	// fires when a variant is removed
	removedEmitter: EventEmitter<Variant>;
	variants: Variant[];
	variantNames: string[];
}