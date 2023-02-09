// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterViewInit, Directive, OnInit, ViewChild } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Message } from '@app/_models/message';
import { Response } from '@app/_models/response';
import { environment } from '@environments/environment';
import { TranslocoService } from '@ngneat/transloco';

/**
 * AbstractSEC stands for Abstract Simple Entity Component.
 */
@Directive()
export abstract class AbstractSEC<T /*extends Entity*/> implements OnInit, AfterViewInit
{
	@BlockUI() blockUI: NgBlockUI;

	// Basic attributes for the formular
	isUpdate: boolean = false; // isUpdate == true -> update mode, isUpdate == false -> creation mode

	// every entity form using this base class must have the '#formDirective="ngForm"' property
	@ViewChild('formDirective') private formDirective: NgForm;
	entityForm: FormGroup;
	get f() { return this.entityForm.controls; }

	// table attributes
	filterValue: string = '';
	protected entityDatabase: SimpleEntityHttpDatabase<T> | null;
	dataSource = new MatTableDataSource<T>();
	isLoadingResults = true;

	// Array of error messages to be displayed
	private _errors: string[] = [];
	get errors(): string[] {
		return this._errors;
	}
	protected addError(message: string) {
		this._errors.push(message);
	}
	resetErrors() {
		this._errors = [];
	}

	constructor(protected httpClient: HttpClient, protected transloco: TranslocoService,
		private entityIdField: string|string[], protected entityPathName: string, protected resetArgument: any)
	{}

	ngOnInit(): void
	{
		this.buildForm();
	}

	ngAfterViewInit(): void
	{
		this.entityDatabase = new SimpleEntityHttpDatabase(this.httpClient, this.entityIdField, this.entityPathName);
		this.loadEntities();

		// If the user changes the sort order, reset back to the first page.
		//this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
		/*
		merge(this.sort.sortChange, this.paginator.page)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isLoadingResults = true;
					return this.entityDatabase!.getRepoIssues();
				}),
				map(data => {
					// Flip flag to show that loading has finished.
					this.isLoadingResults = false;
					this.isRateLimitReached = false;
					this.resultsLength = data.total_count;

					return data.items;
				}),
				catchError(() => {
					this.isLoadingResults = false;
					// Catch if the GitHub API has reached its rate limit. Return empty data.
					this.isRateLimitReached = true;
					return observableOf([]);
				})
			).subscribe(data => this.data = data);
			*/
	}

	abstract buildForm(): void;
	abstract dataLoadedHook(data: T[]);
	preEditHook(row: T): T
	{
		return row;
	}

	protected handleError(error: HttpErrorResponse)
	{
		this.isLoadingResults = false;
		this.blockUI.stop();

		if (error.error instanceof ErrorEvent) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error('An error occurred:', error.error.message);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong,
			console.error(
				`Backend returned code ${error.status}, ` +
				`body was: `, error.error);
		}
		this.addError('We\'re sorry. There is a technical problem.');
		// return an observable with a user-facing error message
		//return throwError('We\'re sorry. There is a technical problem.');

		// If you want to return a new response:
        //return of(new HttpResponse({body: [{name: "Default value..."}]}));

        // If you want to return the error on the upper level:
        //return throwError(error);
		return EMPTY;
	};

	protected handleMessage(message: Message)
	{
		// TODO Format the message appropriately, translate it if possible
		this.addError(message.placeholderMessage);
	}

	protected loadEntities() : void
	{
		this.isLoadingResults = true;
		this.blockUI.start();
		this.entityDatabase!.getAllEntities()
			.pipe(
				retry(3),
				map((result: Response<T[]>) => {
					this.isLoadingResults = false;
					this.blockUI.stop();
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Loading entities failed.');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					this.isLoadingResults = false;
					this.blockUI.stop();
					return this.handleError(error);
				}),
			).subscribe((data: T[]) => {
				this.dataLoadedHook(data);
				this.dataSource.data = data;
			});
	}

	onSubmit(): void
	{
		if (this.entityForm.valid) {
			let entity: T = this.entityForm.getRawValue();
			let observable: Observable<Response<any>> = null;

			this.isLoadingResults = true;
			this.blockUI.start();

			// transmit the form
			if (this.isUpdate) {
				// update the entity
				observable = this.entityDatabase.updateEntity(entity);
			} else {
				// create the entity
				observable = this.entityDatabase.createEntity(entity);
			}

			observable.pipe(
					map((result: Response<any>) => {
						this.isLoadingResults = false;
						this.blockUI.stop();
						if (result.status === 'success') {
							return result.data;
						} else {
							this.handleMessage(result.message);
							throw new Error('Entity operation failed.');
						}
					}),
					catchError((error: HttpErrorResponse) => {
						this.isLoadingResults = false;
						this.blockUI.stop();
						return this.handleError(error);
					})
				).subscribe(data => {
					// reset the form on success
					this.formDirective.resetForm('');
					this.onClear();
					this.loadEntities();
				});
		}
	}

	onClear(): void
	{
		this.entityForm.reset(this.resetArgument);
		this.isUpdate = false;
	}

	onEditRow(row: T): void
	{
		row = this.preEditHook(row);
		this.entityForm.reset();
		this.entityForm.setValue(row);
		this.isUpdate = true;
	}

	onDeleteRow(row: T): void
	{
		this.isUpdate = true;
		this.isLoadingResults = true;
		this.blockUI.start();

		let entity: T = row;
		let observable: Observable<Response<any>> = this.entityDatabase.deleteEntity(entity);
		observable.pipe(
				map((result: Response<any>) => {
					this.isLoadingResults = false;
					this.blockUI.stop();
					if (result.status === 'success') {
						return result.data;
					} else {
						this.handleMessage(result.message);
						throw new Error('Delete failed!');
					}
				}),
				catchError((error: HttpErrorResponse) => {
					this.isLoadingResults = false;
					this.blockUI.stop();
					return this.handleError(error);
				})
			).subscribe(data => {
				this.isUpdate = false;
				this.loadEntities();
			}, error => {
			});
	}

	applyFilter(event: Event)
	{
		let filterValue;
		if (event === null) {
			filterValue = '';
		} else {
			filterValue = (event.target as HTMLInputElement).value;
		}
		this.dataSource.filter = filterValue.trim().toLowerCase();
	}

	executeTypedGetAll<U>(apiPath: string): Observable<Response<U[]>>
	{
		const requestUrl = `${environment.apiUrl}/admin/${apiPath}/`;
		return this.httpClient.get<Response<U[]>>(requestUrl);
	}
}

export interface Entity
{
	id: any|null;
}

export class SimpleEntityHttpDatabase<T /*extends Entity*/>
{
	constructor(private _httpClient: HttpClient, private entityIdField: string|string[], private entityPathName: string)
	{}

	getAllEntities(): Observable<Response<T[]>>
	{
		const href = `${environment.apiUrl}/admin/${this.entityPathName}/`;
		const requestUrl = `${href}`;

		return this._httpClient.get<Response<T[]>>(requestUrl);
	}

	createEntity(entity: T): Observable<Response<number>>
	{
		const href = `${environment.apiUrl}/admin/${this.entityPathName}/`;
		const requestUrl = `${href}`;

		//this.http.put(this.restUrl + restApiUrl, data).pipe(share());
		return this._httpClient.post<Response<number>>(requestUrl, entity);
	}

	updateEntity(entity: T): Observable<Response<T>>
	{
		// IDs must be set in order to update an entity
		let idCheckResult: boolean = this.checkIDs(entity);

		if (idCheckResult && !(entity === null || entity === undefined)) {
			const requestUrl = `${environment.apiUrl}/admin/${this.entityPathName}/` + this.buildApiIdAttachment(entity);
			return this._httpClient.put<Response<T>>(requestUrl, entity);
		} else {
			return new Observable(subscriber => {
				subscriber.error('No entity to update');
			});
		}
	}

	deleteEntity(entity: T): Observable<Response<any>>
	{
		// IDs must be set in order to delete an entity
		let idCheckResult: boolean = this.checkIDs(entity);

		if (idCheckResult && !(entity === null || entity === undefined)) {
			const requestUrl = `${environment.apiUrl}/admin/${this.entityPathName}/` + this.buildApiIdAttachment(entity);
			const options = {
				headers: new HttpHeaders(),
				body: entity
			  };
			return this._httpClient.delete<Response<T>>(requestUrl, options);
		} else {
			return new Observable(subscriber => {
				subscriber.error('No entity to delete');
			});
		}
	}

	// checks if all ID fields have content
	private checkIDs(entity: T): boolean
	{
		let idCheckResult: boolean = false;
		if (typeof this.entityIdField === 'string') {
			if (!(entity[this.entityIdField] === null || entity[this.entityIdField] === undefined))
			{
				idCheckResult = true;
			}
		} else {
			idCheckResult = true;
			for (let entityIdField of this.entityIdField) {
				if (entity[entityIdField] === null || entity[entityIdField] === undefined)
				{
					idCheckResult = false;
					break;
				}
			}
		}
		return idCheckResult;
	}

	private buildApiIdAttachment(entity: T): string
	{
		let result: string = '';
		if (typeof this.entityIdField === 'string') {
			result = `${entity[this.entityIdField]}`;
		} else {
			let first = true;
			for (let entityIdField of this.entityIdField) {
				if (first) {
					let value = entity[entityIdField];
					// Calling URLs in backend/Javalin with an empty parameter does not work. So for now we'll
					// use '-' as the value for an empty first value (should only be the scope of the UiTranslations, for now)
					value = !value || value == '' ? '-' : value;
					result += value;
					first = false;
				} else {
					result += `/${entity[entityIdField]}`;
				}
				
			}
		}
		return result;
	}
}
