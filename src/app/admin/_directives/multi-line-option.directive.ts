// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterContentInit, ContentChildren, Directive, ElementRef, QueryList } from '@angular/core';
import { MatLine, setLines } from '@angular/material/core';

/**
 * Idea and code was taken from:
 * https://stackoverflow.com/a/61901697
 */
@Directive({
	selector: 'mat-option[multi-line-option], mat-option[multiLineOption]',
	// tslint:disable-next-line: no-host-metadata-property
	host: {
		class: 'multi-line-option'
	},
	exportAs: 'multiLineOption'
})
export class MultiLineOptionDirective implements AfterContentInit
{
	@ContentChildren(MatLine, { descendants: true, read: MatLine })
	public lines: QueryList<MatLine>;

	constructor(protected element: ElementRef<HTMLElement>)
	{ }

	public ngAfterContentInit(): void {
		setLines(this.lines, this.element);
	}
}