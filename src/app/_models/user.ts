// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The User object retrieved after log-in.
 */
export interface User
{
	username: string;
	firstname: string;
	lastname: string;
	failedLogins: number;
	token?: string;
}

export function isUser(o: any): o is Response
{
	return typeof o === 'object'
		&& ('username' in o && typeof o.username === 'string')
		&& ('firstname' in o && typeof o.firstname === 'string')
		&& ('lastname' in o && typeof o.lastname === 'string')
		&& (!('token' in o) || ('token' in o && typeof o.token === 'string'));
}
