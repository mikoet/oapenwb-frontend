// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
import { first } from 'rxjs/operators';

import { Location } from '@angular/common';
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isMessage } from '@app/_models/message';
import { isUser } from '@app/_models/user';
import { AccountService } from '@app/shared/_services/account.service';
import { TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit
{
	readonly form = new FormGroup({
		email: new FormControl('', Validators.required),
		password: new FormControl('', Validators.required),
	});
	returnURL: string;
	errorMsg: string = '';

	//matcher = new LoginErrorStateMatcher();

	constructor(
		private location: Location,
		private route: ActivatedRoute,
		private router: Router,
		private transloco: TranslocoService,
		private accountService: AccountService,
	) {
		// redirect to home if already logged in
		if (this.accountService.currentUserValue) {
			this.router.navigate(['/']);
			//this.location.back();
		}
	}

	get f() { return this.form.controls; }

	ngOnInit(): void
	{
		// get return url from route parameters or default to '/'
		this.returnURL = this.route.snapshot.queryParams['returnURL'] || '/';
	}

	onSubmit(): void
	{
		this.accountService.login(this.f.email.value, this.f.password.value)
			.pipe(
				first()
			)
			.subscribe({
				next: result => {
					if (isUser(result)) {
						// Login was OK
						this.router.navigate([this.returnURL]);
					}
				},
				error: error => {
					if (isMessage(error)) {
						this.errorMsg = error.placeholderMessage;
					} else if (typeof error === 'string') {
						this.errorMsg = error;
					} else {
						this.errorMsg = 'Dat inloggen weer nich möäglik.';
					}
					//this.loading = false;
				}
			});
	}
}