// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Represents a (error) message from the backend.
 */
export interface Message {
	code: number;
	message: string;
	arguments: Pair[];
}

export function isMessage(o: any): o is Message {
	return typeof o === 'object'
		&& ('code' in o && typeof o.code === 'number')
		&& ('message' in o && (o.message === null || typeof o.message === 'string'))
		&& ('arguments' in o && (o.arguments === null || Array.isArray(o.arguments)));
}

export interface Pair {
	key: string;
	value: any;
}