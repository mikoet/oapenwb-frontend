// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockUIModule } from 'ng-block-ui';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '@app/shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ImprintComponent } from './dict/duty/imprint/imprint.component';
import { FooterComponent } from './dict/footer/footer.component';
import { HeaderComponent } from './dict/header/header.component';
import { MainComponent } from './dict/main/main.component';
import {
	DirectionSelectComponent
} from './dict/table-view/direction-select/direction-select.component';
import {
	LangPairSelectComponent
} from './dict/table-view/lang-pair-select/lang-pair-select.component';
import { ResultTableComponent } from './dict/table-view/result-table/result-table.component';
import { TableViewComponent } from './dict/table-view/table-view.component';
import { TranslocoRootModule } from './transloco-root.module';

// Dit is düdelik beater as en eigen material.module.ts to bruken:
// Bruukt eyn a.b. lazy loading, so kan eyn in elk module dat loaden wat eyn dår ouk
// innedåd bruukt un laadt nich in alle modulen allens uut dat material.module.ts
const material = [
	MatAutocompleteModule,
	MatButtonModule,
	MatButtonToggleModule,
	MatCardModule,
	MatIconModule,
	MatInputModule,
	MatListModule,
	MatMenuModule,
	MatTooltipModule,
];

@NgModule({
	declarations: [
        AppComponent,
        MainComponent,
        TableViewComponent,
        ResultTableComponent,
        LangPairSelectComponent,
        DirectionSelectComponent,
        FooterComponent,
        HeaderComponent,
        ImprintComponent
    ],
    bootstrap: [
		AppComponent,
	],
	imports: [
		BrowserModule.withServerTransition({ appId: 'serverApp' }),
        BlockUIModule.forRoot({
            delayStart: 500,
            /*delayStop: 500*/
        }),
        AppRoutingModule,
        BrowserAnimationsModule,
        FontAwesomeModule,
        FormsModule,
        material,
        ReactiveFormsModule,
        TranslocoRootModule,
        SharedModule
	],
	providers: [
		provideHttpClient(withInterceptorsFromDi()),
	] })
export class AppModule { }
