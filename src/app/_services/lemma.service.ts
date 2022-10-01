// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

export interface LangConfig {
	locale: string;
	showOrthography?: boolean;
}

@Injectable({
	providedIn: 'root'
})
export class LemmaService
{
	constructor(
		private transloco: TranslocoService
	)
	{}

	// Hint: method could get a parameter 'config' instead of 'locale' in future,
	//       containing a small formatting configuration (locale, orthographies to show/hide, …).
	//       That config could be made out of the presets, maybe.
	formatLemmaStr(text: string, config?: LangConfig): string {
		const showOrthography = config?.showOrthography;

		if (!text) {
			return '';
		}

		// Put the words/phrases into span tags
		text = text.replace(/\{[^\}]+\}/g, (match) => {
			const term = match.substring(1, match.length - 1);
			//return `<a [routerLink]="['.']" [queryParams]="{term: term}">${term}</a>`;
			if (!!config && !!config.locale && config.locale !== this.transloco.getActiveLang()) {
				return `<span lang="${config.locale}">${term}</span>`;
			}
			return `<span>${term}</span>`;
		});

		// Replace orthographies
		if (showOrthography) {
			text = text.replace(/\^\[[A-Za-z0-9,. ]+\]/g, (match) => {
				const orthographies = match.substring(2, match.length - 1);
				return '<sup>' + orthographies +'</sup>';
			});
		} else {
			text = text.replace(/\^\[[A-Za-z0-9,. ]+\]/g, (match) => {
				return '';
			});
		}

		// Replace dialects: ((...))
		const dRegex = /\(\([A-Za-z0-9_\-:!@]{2,32}(, [A-Za-z0-9_\-:!@]{2,32}){0,31}\)\)/g
		text = text.replace(dRegex, (match) => this.substituteUitIdStr(match, 2, 2, 'abbr', '<small matTooltip="En test!">(', ')</small>'));

		// Replace categories: [[...]]
		const cRegex = /\[\[[A-Za-z0-9_\-:!@]{2,32}(, [A-Za-z0-9_\-:!@]{2,32}){0,31}\]\]/g
		text = text.replace(cRegex, (match) => this.substituteUitIdStr(match, 2, 2, 'abbr', '<small><span style="font-variant: small-caps;">[', ']</span></small>'));

		// Replace levels: [/.../]
		const lRegex = /\[\/[A-Za-z0-9_\-:!@]{2,32}(, [A-Za-z0-9_\-:!@]{2,32}){0,31}\/\]/g
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
