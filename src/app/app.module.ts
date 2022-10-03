// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HttpClientModule } from '@angular/common/http';
import { TranslocoRootModule } from './transloco-root.module';

import { BlockUIModule } from 'ng-block-ui';

import { AppComponent } from './app.component';
import { MainComponent } from './dict/main/main.component';
import { TableViewComponent } from './dict/table-view/table-view.component';
import { ResultTableComponent } from './dict/table-view/result-table/result-table.component';

import { SharedModule } from '@app/shared/shared.module';
import { LangPairSelectComponent } from './dict/table-view/lang-pair-select/lang-pair-select.component';
import { DirectionSelectComponent } from './dict/table-view/direction-select/direction-select.component';
import { FooterComponent } from './dict/footer/footer.component';
import { HeaderComponent } from './dict/header/header.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MarkdownModule } from 'ngx-markdown';

// Dit is düdelik beater as en eigen material.module.ts to bruken:
// Bruukt eyn a.b. lazy loading, so kan eyn in elk module dat loaden wat eyn dår ouk
// innedåd bruukt un laadt nich in alle modulen allens uut dat material.module.ts
const material = [
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
    HeaderComponent
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
	MarkdownModule.forRoot(),
	material,
	HttpClientModule,
	TranslocoRootModule,
	SharedModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
