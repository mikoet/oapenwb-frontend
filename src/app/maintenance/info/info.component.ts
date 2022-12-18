// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnDestroy, OnInit } from '@angular/core';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { ReplaySubject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const sentences = [
	{
		lang: 'nds',
		text: 'Ünderhold (systeempleag). Koam doch en beaten later wedder inkyken.',
	},
	{
		lang: 'en',
		text: 'Maintenance. Please check back a little later.',
	},
	{
		lang: 'da',
		text: 'Vedligeholdelse. Venligst tjek tilbage lidt senere.',
	},
	{
		lang: 'de',
		text: 'Wartungsarbeiten. Schau doch etwas später wieder herein.',
	},
	{
		lang: 'nl',
		text: 'Onderhoud. Kom wat later terug.',
	},
	{
		lang: 'sv',
		text: 'Underhåll. Vänligen titta tillbaka lite senare.',
	},
	{
		lang: 'fi',
		text: 'Huolto. Tarkista asia hieman myöhemmin.',
	},
]

@Component({
	selector: 'app-info',
	templateUrl: './info.component.html',
	styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit, OnDestroy
{
	icon = faScrewdriverWrench;
	lang = sentences[0].lang;
	text = sentences[0].text;
	destroy$ = new ReplaySubject<void>(1);

	private pointer: number = 0;

	ngOnInit(): void {
		timer(5000, 5000).pipe(
			takeUntil(this.destroy$),
		).subscribe(val => {
			if (this.pointer < sentences.length - 1) {
				this.pointer++;
			} else {
				this.pointer = 0;
			}
			this.lang = sentences[this.pointer].lang;
			this.text = sentences[this.pointer].text;
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
