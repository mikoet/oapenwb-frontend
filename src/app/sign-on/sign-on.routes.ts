// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { Routes } from '@angular/router'

import { ROUTE_LOGIN, ROUTE_REGISTER, ROUTE_FORGOT_PW } from '@app/routes'

import { LoginComponent } from './login/login.component'
import { RegisterComponent } from './register/register.component'
import { ForgotPwComponent } from './forgot-pw/forgot-pw.component'

export const SIGN_ON_ROUTES: Routes = [
	{
		path: ROUTE_LOGIN.path,
		component: LoginComponent,
	},
	{
		path: ROUTE_REGISTER.path,
		component: RegisterComponent,
	},
	{
		path: ROUTE_FORGOT_PW.path,
		component: ForgotPwComponent,
	},
]
