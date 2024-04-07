// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterViewInit, Directive, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, NgForm } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Message } from '@app/_models/message';
import { Response } from '@app/_models/response';
import { environment } from '@environments/environment';
import { TranslocoService } from '@ngneat/transloco';

import { DataService } from '../_services/data.service';
import { SimpleEntityHttpDatabase } from './abstract-simple-entity';

/**
 * AbstractSECPlus stands for Abstract Simple Entity Component Plus. Plus, because it uses the DataService.
 */
@Directive()
export abstract class AbstractSECPlus<T /*extends Entity*/> implements OnInit, AfterViewInit
{
	@BlockUI() blockUI: NgBlockUI;

	// Basic attributes for the formular
	isUpdate: boolean = false; // isUpdate == true -> update mode, isUpdate == false -> creation mode

	// HWA NEW
	loadingSubscription: Subscription;

	// every entity form using this base class must have the '#formDirective="ngForm"' property
	@ViewChild('formDirective') private formDirective: NgForm;
	entityForm: UntypedFormGroup;
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

	constructor(public data: DataService, protected httpClient: HttpClient, protected transloco: TranslocoService,
		private entityIdField: string|string[], protected entityPathName: string, protected resetArgument: any)
	{}

	ngOnInit(): void
	{
		this.buildForm();
		this.loadingSubscription = this.data.loading.subscribe(isLoading => {
			if (isLoading) {
				// TODO
				//this.startBlock('dataService');
				this.blockUI.start();
			} else {
				//this.stopBlock('dataService');
				this.blockUI.stop();
			}
		});
	}

	ngAfterViewInit(): void
	{
		// TODO Maybe one day this could be replaced with an own HttpDatabase class (instead of SimpleEntityHttpDatabase) that
		//      uses the DataService to load entities
		this.entityDatabase = new SimpleEntityHttpDatabase(this.httpClient, this.entityIdField, this.entityPathName);
		this.loadEntities();
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
			let entity: T = this.entityForm.value;
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
