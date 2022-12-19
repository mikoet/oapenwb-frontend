// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AbstractControl, FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';

import { first } from 'rxjs/operators';

import { AccountService } from '@app/shared/_services/account.service';

import { isMessage } from '@app/_models/message';
import { isUser } from '@app/_models/user';
import { TranslocoService } from '@ngneat/transloco';

// custom validator to check that two fields match
/*
export function mustMatch(controlName: string, matchingControlName: string)
{
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const matchingControl = formGroup.controls[matchingControlName];

        if (matchingControl.errors && !matchingControl.errors.mustMatch) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        // set error on matchingControl if validation fails
        if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ mustMatch: true });
        } else {
            matchingControl.setErrors(null);
        }
    }
}
*/

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
	form: FormGroup;
	returnURL: string;
	errorMsg: string = '';

	//matcher = new LoginErrorStateMatcher();

	public static matchValues( matchTo: string /* name of the control to match to */)
		: (AbstractControl) => ValidationErrors | null
	{
		return (control: AbstractControl): ValidationErrors | null => {
			return !!control.parent &&
				!!control.parent.value &&
				control.value === control.parent.controls[matchTo].value
					? null : { matching: false };
		};
	}

	constructor(private formBuilder: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
		private accountService: AccountService,
		private transloco: TranslocoService,
	) {
		// redirect to home if already logged in
		if (this.accountService.currentUserValue) {
			this.router.navigate(['/']);
		}
	}

	get f() { return this.form.controls; }

	ngOnInit(): void
	{
		this.form = this.formBuilder.group({
			firstname: ['', Validators.required],
			lastname: ['', Validators.required],
			username: [''],
			email: ['', [Validators.required, Validators.pattern("\\b[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\b")]],
			token: ['', Validators.required],
			password: ['', [Validators.required,  Validators.minLength(10)]],
			password2: ['', RegisterComponent.matchValues('password')],
			compliance: ['', Validators.requiredTrue]
		});

		// needed for changes on password after changes on password2
		this.form.get('password').valueChanges.subscribe(() => {
			this.form.get('password2').updateValueAndValidity();
		});
		
		// get return url from route parameters or default to '/'
		this.returnURL = this.route.snapshot.queryParams['returnURL'] || '/';
	}

	onSubmit(): void
	{
		this.accountService.register(
			this.f.firstname.value,
			this.f.lastname.value,
			this.f.username.value,
			this.f.email.value,
			this.f.token.value,
			this.f.password.value,
			this.transloco.getActiveLang()	// TODO Ask for the preferred locale?
		) .pipe(
			first()
		).subscribe({
			next: result => {
				if (isUser(result)) {
					// Registration was OK
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
	}
}
