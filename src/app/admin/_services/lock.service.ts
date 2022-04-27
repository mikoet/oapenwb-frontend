// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { catchError, tap, switchAll } from 'rxjs/operators';
import { EMPTY, Subject } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable()
export class LockService {
	////private readonly requestUrl = `${environment.wsUrl}/websocket`; //${lexemesApiPath}/`;
	//private subject = webSocket(this.requestUrl);

	private socket$: WebSocketSubject<any>;
	private messagesSubject$ = new Subject();
	public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e }));

	constructor() { }

	public connect(): void {
		/*********
		if (!this.socket$ || this.socket$.closed) {
			this.socket$ = this.getNewWebSocket();
			const messages = this.socket$.pipe(
				tap({
					error: error => console.log(error),
				}), catchError(_ => EMPTY));
			this.messagesSubject$.next(messages);
			console.info('CONNECTED:', this.requestUrl);
		}
		*/
	}

	private getNewWebSocket() {
		return null; ////webSocket(this.requestUrl);
	}
	sendMessage(msg: any) {
		//////this.socket$.next(msg);
	}
	close() {
		//////this.socket$.complete();
	}
}