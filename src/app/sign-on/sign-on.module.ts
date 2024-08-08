// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TRANSLOCO_SCOPE } from '@jsverse/transloco';

import { TranslocoRootModule } from '@app/transloco-root.module';
import { SignOnRoutingModule } from './sign-on-routing.module';
import { SharedModule } from '@app/shared/shared.module';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
