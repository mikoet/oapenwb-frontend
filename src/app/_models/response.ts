// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Message, isMessage } from './message';

enum ResponseStatus
{
	Success = 'success',
	Fail = 'fail',
	Error = 'error'
}

/**
 * A response from the backend.
 */
export interface Response<T> {
	status: ResponseStatus;
	data: T|null;
	message: Message;
}

/**
 * A response from the backend.
 */
 export interface MultiResponse<T> {
	status: string;
	data: T|null;
	messages: Message[];
}

/**
 * A paginated response from the backend.
 */
export interface PaginatedResponse<T> extends Response<T> {
	pagination: Pagination;
}

export class Pagination
{
	offset: number;
	limit: number;
	total: number;
}

export function isResponse(o: any): o is Response<any> {
	return typeof o === 'object'
		&& ('status' in o && typeof o.status === 'string')
		&& ('data' in o && (o.data === null || typeof o.data === 'object'))
		&& ('message' in o && (o.message === null || isMessage(o.message)));
}

/*
export function isMultiResponse(o: any): o is MultiResponse<any> {
	return typeof o === 'object'
		&& ('status' in o && typeof o.status === 'string')
		&& ('data' in o && (o.data === null || typeof o.data === 'object'))
		&& ('messages' in o && (o.messages === null || isMessage(o.message))); // TODO Check for array instead of isMessage()
}
*/

export function isPagination(o: any): o is Pagination {
	return typeof o === 'object'
		&& ('offset' in o && typeof o.offset === 'number')
		&& ('limit' in o && typeof o.limit === 'number')
		&& ('total' in o && typeof o.total === 'number');
}

export function isPaginatedResponse(o: any): o is PaginatedResponse<any> {
	return typeof o === 'object'
		&& ('status' in o && typeof o.status === 'string')
		&& ('data' in o && (o.data === null || typeof o.data === 'object'))
		&& ('message' in o && (o.message === null || isMessage(o.message)))
		&& ('pagination' in o && (o.pagination !== null || isMessage(o.message)));
}