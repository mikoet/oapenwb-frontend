// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

// SPDX-License-Identifier: AGPL-3.0-only
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Message } from '@app/_models/message';
import {
	ErrorsDialogComponent
} from '@app/admin/_components/errors-dialog/errors-dialog.component';
import { YesNoDialogComponent } from '@app/admin/_components/yes-no-dialog/yes-no-dialog.component';
import { DataService, ErrorSet } from '@app/admin/_services/data.service';
import { LexemeQueryService } from '@app/admin/_services/lexeme-query.service';
import {
	LexemeOrigin, LexemeService, SelectedLexeme, SnackMessage
} from '@app/admin/_services/lexeme.service';
import { ScopedBlocker } from '@app/util/scoped-blocker';
import { TranslocoService } from '@ngneat/transloco';

import { EditorComponent } from '../editor/editor.component';
import { ListComponent } from '../list/list.component';

export class TransferStop
{
	uitID: string;
	params: { [key: string]: any };
}

enum BlockScopes
{
	DataService = 'dataService',
	ListEntries = 'listEntries',
	ActiveLexeme = 'activeLexeme',
}

@Component({
	selector: 'app-view',
	templateUrl: './view.component.html',
	styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy
{
	@BlockUI()
	private blockUI: NgBlockUI;
	private blocker: ScopedBlocker = new ScopedBlocker();

	@ViewChild('editor')
	editor: EditorComponent;
	@ViewChild('list')
	list: ListComponent;

	// from DataService
	loading$: Observable<boolean>;
	errors$: Observable<ErrorSet>;

	private readonly destroy$ = new ReplaySubject<void>(1);

	constructor(
		private readonly changeDetector: ChangeDetectorRef,
		private readonly snackBar: MatSnackBar,
		private readonly transloco: TranslocoService,
		public readonly data: DataService,
		public readonly lexemeService: LexemeService,
		private readonly lexemeQuery: LexemeQueryService,
		private readonly dialog: MatDialog)
	{}

	ngOnInit() : void {
		this.blocker.blockUI = this.blockUI;

		this.loading$ = this.data.loading;
		this.errors$ = this.data.errors;

		this.loading$.pipe(
			takeUntil(this.destroy$),
		).subscribe(isLoading => {
			if (isLoading) {
				this.blocker.start(BlockScopes.DataService);
			} else {
				this.blocker.stop(BlockScopes.DataService);
			}
		});

		this.errors$.pipe(
			takeUntil(this.destroy$),
		).subscribe(errorSet => {
			if (errorSet !== null) {
				console.error('An error occured during initialisation:', errorSet);
				this.blocker.stop(BlockScopes.DataService);
			}
		});

		// from LexemeService
		this.lexemeService.activeLexeme.pipe(
			takeUntil(this.destroy$),
		).subscribe(active => {
			if (active !== null) {
				this.editor.readFromService().subscribe(nothing => {
					this.blocker.stop(BlockScopes.ActiveLexeme);
				}, error => {
					// TODO Can errors happen? What kind of errors can?
					console.error('ViewComponent – activeSubscription –', error);
					this.blocker.stop(BlockScopes.ActiveLexeme);
				});
			} else {
				// if the active lexeme is set to null all tabs must be resetted
				if (this.editor) {
					this.editor.resetComponent();
				}
				this.blocker.stop(BlockScopes.ActiveLexeme);
			}
		});

		this.lexemeService.errorChange.pipe(
			takeUntil(this.destroy$),
		).subscribe(errorCount => {
			this.changeDetector.detectChanges();
		});

		this.lexemeService.snackMessage.pipe(
			takeUntil(this.destroy$),
		).subscribe((message: SnackMessage) => {
			if (message) {
				const messageText: string = this.transloco.translate(message.uitID, message.arguments);
				const actionText: string = this.transloco.translate('admin.close');
				this.snackBar.open(messageText, actionText, {
					duration: 3500,
					horizontalPosition: 'start',
					verticalPosition: 'bottom',
				});
			}
		});

		// from LexemeQueryService
		this.lexemeQuery.pagination.pipe(
			takeUntil(this.destroy$),
		).subscribe(pagination => {
			this.blocker.stop(BlockScopes.ListEntries);
		});

		this.lexemeQuery.error.pipe(
			filter((message) => !!message),
			takeUntil(this.destroy$),
		).subscribe((message: Message|string) => {
			const actionText: string = this.transloco.translate('admin.close');
			let messageText: string = '';
			if (typeof message === 'string') {
				messageText = message;
			} else {
				// TODO Format message correctly
				messageText = message?.placeholderMessage;
			}
			this.snackBar.open(messageText, actionText, {
				duration: 3500,
				horizontalPosition: 'start',
				verticalPosition: 'bottom',
			});
		});

		this.data.initialise();
	}

	ngOnDestroy() : void
	{
		this.destroy$.next();
		this.destroy$.complete();

		// Write current data to service
		this.writeToService(false);
		// Set active lexeme to null
		this.lexemeService.activateLexeme(null);
		// here we just keep the stopping simple
		this.blockUI.stop();
	}

	newLexemeClicked() : void
	{
		this.writeToService(false);
		this.lexemeService.createLexeme();
		this.editor.selectTab(0);
	}

	editClicked() : void
	{
		this.blocker.start(BlockScopes.ActiveLexeme);
		this.lexemeService.editLexeme();
	}

	saveClicked() : void
	{
		this.blocker.start(BlockScopes.ActiveLexeme);
		this.writeToService(false);
		this.lexemeService.saveActiveLexeme();
	}

	discardClicked() : void
	{
		if (this.lexemeService.isActiveLexemeChanged()) {
			const dialogRef = this.dialog.open(YesNoDialogComponent, {
				data: {
					uitIdTitle: 'discardL:title',
					uitIdContent: 'discardL:content'
				}
			});
			dialogRef.afterClosed().subscribe(discard => {
				if (discard === true) {
					this.blocker.start(BlockScopes.ActiveLexeme);
					this.lexemeService.discardActiveLexeme();
				}
			});
		} else {
			this.blocker.start(BlockScopes.ActiveLexeme);
			this.lexemeService.discardActiveLexeme();
		}
	}

	showErrorsClicked() : void
	{
		/*const dialogRef =*/ this.dialog.open(ErrorsDialogComponent, {
			data: {
				messages: this.lexemeService.getActiveLexemeErrors()
			}
		});
	}

	decoupleClicked() : void
	{
		this.lexemeService.decoupleActiveLexeme();
	}

	loadClicked() : void
	{
		this.blocker.start(BlockScopes.ListEntries);
		// TODO set de filterOptions by den lexemeQuery service
		this.lexemeQuery.loadAndKeep();
	}

	lexemeSelected(event: SelectedLexeme): void
	{
		// Die View muss sich immer das alte SelectedLexeme speichern und kann dieses notfalls wieder aktivieren auf dem LexemeService.
		// Es muss, bevor es hier etwas tut, auch prüfen, ob das neue Lexeme ein anderes ist als das alte, und nur handeln, wenn sie sich unterscheiden
		// TODO call writeToService, and only if it succeeded without errors, call activateLexeme etc.
		this.blocker.start(BlockScopes.ActiveLexeme);
		this.writeToService(false);
		this.lexemeService.activateLexeme(event);
		// TODO readFromService on activation
	}

	nextPage() : void
	{
		this.blocker.start(BlockScopes.ListEntries);
		this.writeToService(false);
		this.resetActiveNonTopListLexeme();
		this.list.nextPage();
	}

	previousPage(): void
	{
		this.blocker.start(BlockScopes.ListEntries);
		this.writeToService(false);
		this.resetActiveNonTopListLexeme();
		this.list.previousPage();
	}

	private writeToService(doValidation: boolean) : void
	{
		if (this.lexemeService.store.active !== null
			&& this.lexemeService.store.active.origin === LexemeOrigin.TopList)
		{
			this.editor.writeToService(doValidation);
			this.lexemeService.updateSlimLexeme();
		}
	}

	private resetActiveNonTopListLexeme() : void
	{
		if (this.lexemeService.store.active !== null
			&& this.lexemeService.store.active.origin !== LexemeOrigin.TopList)
		{
			this.lexemeService.activateLexeme(null);
		}
	}
}