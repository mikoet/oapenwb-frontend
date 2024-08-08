// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { first } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isMessage } from '@app/_models/message';
import { isUser } from '@app/_models/user';
import { AccountService } from '@app/shared/_services/account.service';
import { TranslocoService } from '@jsverse/transloco';
import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgIf } from '@angular/common';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatError, MatHint } from '@angular/material/form-field';
import { SimpleCardFormComponent } from '../simple-card-form/simple-card-form.component';

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

const EMAIL_PATTERN = "\\b[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\b";

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    standalone: true,
    imports: [SimpleCardFormComponent, FormsModule, ReactiveFormsModule, MatFormField, MatInput, NgIf, MatError, MatHint, MatCheckbox, MatButton, RouterLink, RoutingPipe]
})
export class RegisterComponent implements OnInit {
	readonly form = new FormGroup({
		firstname: new FormControl('', Validators.required),
		lastname: new FormControl('', Validators.required),
		username: new FormControl(''),
		email: new FormControl('', [
			Validators.required,
			Validators.pattern(EMAIL_PATTERN),
		]),
		token: new FormControl('', Validators.required),
		password: new FormControl('', [
			Validators.required,
			Validators.minLength(10),
		]),
		password2: new FormControl('', RegisterComponent.matchValues('password')),
		compliance: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }),
	});

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

	constructor(
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
