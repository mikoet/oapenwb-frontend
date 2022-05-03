// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
	providedIn: 'root'
})
export class LemmaService
{
	constructor(
		private transloco: TranslocoService
	)
	{}

	formatLemmaStr(text: string) : string
	{
		if (!text) {
			return '';
		}

		// Put the words/phrases into span tags
		text = text.replace(/\{[^\}]+\}/g, (match) => {
			let term = match.substring(1, match.length - 1);
			//return `<a [routerLink]="['.']" [queryParams]="{term: term}">${term}</a>`;
			return '<span>' + term +'</span>';
		});
		
		// Replace orthographies
		text = text.replace(/\^\[[A-Za-z0-9,. ]+\]/g, (match) => {
			let orthographies = match.substring(2, match.length - 1);
			return '<sup>' + orthographies +'</sup>';
		});

		// Replace dialects: ((...))
		let dRegex = /\(\([A-Za-z0-9_\-:!]{2,32}(, [A-Za-z0-9_\-:!]{2,32}){0,31}\)\)/g
		text = text.replace(dRegex, (match) => this.substituteUitIdStr(match, 2, 2, 'abbr', '<small>(', ')</small>'));

		// Replace categories: [[...]]
		let cRegex = /\[\[[A-Za-z0-9_\-:!]{2,32}(, [A-Za-z0-9_\-:!]{2,32}){0,31}\]\]/g
		text = text.replace(cRegex, (match) => this.substituteUitIdStr(match, 2, 2, 'abbr', '<small><span style="font-variant: small-caps;">[', ']</span></small>'));

		// Replace levels: [/.../]
		let lRegex = /\[\/[A-Za-z0-9_\-:!]{2,32}(, [A-Za-z0-9_\-:!]{2,32}){0,31}\/\]/g
		text = text.replace(lRegex, (match) => this.substituteUitIdStr(match, 2, 2, 'abbr', '<small><i>[', ']</i></small>'));

		return text;
	}

	private substituteUitIdStr(match: string, cutLeft: number, cutRight: number, scope: string,
		prefix: string, postfix: string) : string
	{
		let uitIdStr = match.substring(cutLeft, match.length - cutRight);
		let substitute = ''; // substitute string for the uitID string
		// Split the parts and translate each with transloco
		let uitIDs = uitIdStr.split(',');
		let first = true;
		for (let uitID of uitIDs) {
			uitID = uitID.trim();
			if (!!uitID && uitID.length > 0) {
				let translation = this.transloco.translate(`${scope}.${uitID}`);
				if (!first) {
					substitute += ', ';
				} else {
					first = false;
				}
				substitute += translation;
			}
		}
		return `${prefix}${substitute}${postfix}`;
	}
}
