// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { Location, NgIf } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { first } from 'rxjs/operators';

//import { TranslocoService } from '@jsverse/transloco'

import { AccountService } from '@app/shared/_services/account.service';

import { isMessage } from '@app/_models/message';
import { isUser } from '@app/_models/user';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatError } from '@angular/material/form-field';
import { SimpleCardFormComponent } from '../simple-card-form/simple-card-form.component';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-forgot-pw',
    templateUrl: './forgot-pw.component.html',
    styleUrls: ['./forgot-pw.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, SimpleCardFormComponent, FormsModule, ReactiveFormsModule, MatFormField, MatInput, NgIf, MatError, MatButton, RouterLink, RoutingPipe]
})
export class ForgotPwComponent implements OnInit {

	readonly form = new FormGroup({
		// TODO Add validator for email address
		 email: new FormControl('', Validators.required),
	});

	returnURL: string;
	errorMsg: string = '';

	//matcher = new LoginErrorStateMatcher();

	constructor(
		private location: Location,
		private route: ActivatedRoute,
		private router: Router,
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
		/* TODO implement logic for forgotPW
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
						this.errorMsg = error.message;
					} else if (typeof error === 'string') {
						this.errorMsg = error;
					} else {
						this.errorMsg = 'Dat inloggen weer nich möäglik.';
					}
					//this.loading = false;
				}
			});
		*/
	}
}
