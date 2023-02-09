// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Represents a (error) message from the backend.
 */
export interface Message {
	code: number;
	placeholderMessage: string;
	arguments: Pair[];
}

export function isMessage(o: any): o is Message {
	return typeof o === 'object'
		&& ('code' in o && typeof o.code === 'number')
		&& ('placeholderMessage' in o && (o.placeholderMessage === null || typeof o.placeholderMessage === 'string'))
		&& ('arguments' in o && (o.arguments === null || Array.isArray(o.arguments)));
}

export interface Pair {
	key: string;
	value: any;
}
