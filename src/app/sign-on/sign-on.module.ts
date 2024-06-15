// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { TranslocoRootModule } from '@app/transloco-root.module';
import { SignOnRoutingModule } from './sign-on-routing.module';
import { SharedModule } from '@app/shared/shared.module';

import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

//import { RoutingPipe } from '@app/shared/_pipes/routing.pipe';

import { SimpleCardFormComponent } from './simple-card-form/simple-card-form.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPwComponent } from './forgot-pw/forgot-pw.component';

const material = [
	MatButtonModule,
	MatCardModule,
	MatCheckboxModule,
	MatFormFieldModule,
	MatInputModule,
];

@NgModule({
	imports: [
		CommonModule,
		material,
		TranslocoRootModule,
		SharedModule,
		SignOnRoutingModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule,
	],
	declarations: [
		LoginComponent,
		SimpleCardFormComponent,
		RegisterComponent,
		ForgotPwComponent,
	],
	providers: [
		{ provide: TRANSLOCO_SCOPE, useValue: 'son' }
	]
})
export class SignOnModule { }
