// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { HttpClient } from '@angular/common/http'
import { Component, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core'
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons'
import { ReplaySubject, timer } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { environment } from '@environments/environment'
import { Router } from '@angular/router'
import { ROUTE_TABLE_VIEW } from '@app/routes'
import { getRouteStrWithoutLang } from '@app/shared/_pipes/routing.pipe'
import { DEFAULT_UI_LOCALE } from '@app/_config/config'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { isPlatformBrowser } from '@angular/common'

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
	template: `
		<div class="container">
			<div class="grid-container grid-box">
				<div class="logo row1 colspan2"></div>
				<fa-icon class="icon row2 column1" [icon]="icon"></fa-icon>
				<p class="row2 column2 center-vertical" lang="{{ lang }}">
					{{ text }}
				</p>
			</div>
		</div>
	`,
	styleUrls: ['./info.component.scss'],
	standalone: true,
	imports: [FontAwesomeModule],
})
export class InfoComponent implements OnInit, OnDestroy {
	icon = faScrewdriverWrench
	lang = sentences[0].lang
	text = sentences[0].text
	destroy$ = new ReplaySubject<void>(1)

	private pointer: number = 0

	constructor(
		private http: HttpClient,
		private zone: NgZone,
		private router: Router,
		@Inject(PLATFORM_ID) private platformId: any,
	) {}

	ngOnInit(): void {
		// Change the displaced sentence every 5s
		timer(5_000, 5_000)
			.pipe(takeUntil(this.destroy$))
			.subscribe((val) => {
				if (this.pointer < sentences.length - 1) {
					this.pointer++
				} else {
					this.pointer = 0
				}
				this.lang = sentences[this.pointer].lang
				this.text = sentences[this.pointer].text
			})

		// Make a small http request to see if the backend is back
		if (isPlatformBrowser(this.platformId)) {
			timer(500, 8_000)
				.pipe(takeUntil(this.destroy$))
				.subscribe((val) => {
					this.http
						.get<number>(`${environment.apiUrl}/alive`)
						.pipe(takeUntil(this.destroy$))
						.subscribe((alive: number) => {
							if (alive == 1) {
								const url = `/${DEFAULT_UI_LOCALE}/` + getRouteStrWithoutLang(ROUTE_TABLE_VIEW)
								this.zone.run(() => {
									this.router.navigateByUrl(url).then(() => {
										window.location.reload()
									})
								})
							}
						})
				})
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next()
		this.destroy$.complete()
	}
}
