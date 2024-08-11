// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { DragDropModule } from '@angular/cdk/drag-drop'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatBadgeModule } from '@angular/material/badge'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatSortModule } from '@angular/material/sort'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search'

import { TRANSLOCO_SCOPE } from '@jsverse/transloco'

import { BlockUIModule } from 'ng-block-ui'

import { AdminRoutingModule } from './admin-routing.module'
import { AdminComponent } from './admin.component'
import { SideMenuComponent } from './side-menu/side-menu.component'
import { OrthographyComponent } from './orthography/orthography.component'

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { JwtInterceptor } from '@app/shared/_helpers/jwt.interceptor'

import { NavigationService } from '@app/admin/navigation/navigation.service'

import { DisableControlDirective } from './_directives/disable-control.directive'

import { DataService } from './_services/data.service'
import { LexemeQueryService } from './_services/lexeme-query.service'
import { LexemeService } from './_services/lexeme.service'
import { SememeService } from './_services/sememe.service'
import { SynGroupQueryService } from './_services/syn-group-query.service'
import { LockService } from './_services/lock.service'

import { NavMenuComponent } from './side-menu/layout/nav-menu/nav-menu.component'
import { NavItemComponent } from './side-menu/layout/nav-item/nav-item.component'
import { UiLanguageComponent } from './ui-language/ui-language.component'
import { UiScopeComponent } from './ui-scope/ui-scope.component'
import { UiTranslationComponent } from './ui-translation/ui-translation.component'
import { UiResultCategoryComponent } from './ui-result-category/ui-result-category.component'
import { LanguageComponent } from './language/language.component'
import { LangPairComponent } from './lang-pair/lang-pair.component'
import { LangOrthoMappingComponent } from './lang-ortho-mapping/lang-ortho-mapping.component'
import { LexemeTypeComponent } from './lexeme-type/lexeme-type.component'
import { LexemeFormTypeComponent } from './lexeme-form-type/lexeme-form-type.component'
import { UnitLevelComponent } from './unit-level/unit-level.component'
import { CategoryComponent } from './category/category.component'
import { ViewComponent } from './lexemes/view/view.component'
import { ListComponent } from './lexemes/list/list.component'
import { EditorComponent } from './lexemes/editor/editor.component'
import { LexemeLinkComponent } from './_components/lexeme-link/lexeme-link.component'
import { TabGeneralComponent } from './lexemes/tab-1-general/tab-general.component'
import { TabVariantsComponent } from './lexemes/tab-2-variants/tab-variants.component'
import { TabSememesComponent } from './lexemes/tab-3-sememes/tab-sememes.component'
import { TabLinksComponent } from './lexemes/tab-5-links/tab-links.component'
import { TabCommentsComponent } from './lexemes/tab-7-comments/tab-comments.component'
import { OtherTranslationsComponent } from './_components/other-translations/other-translations.component'
import { DisableFormComponent } from './_components/disable-form/disable-form.component'
import { LexemeFormComponent } from './lexemes/lexeme-form/lexeme-form.component'
import { LemmaTemplateComponent } from './lemma-template/lemma-template.component'
import { TypeLanguageConfigComponent } from './type-language-config/type-language-config.component'
import { FormTypePositionsDialog } from './type-language-config/form-type-positions-dialog'
import { LexemeFormsComponent } from './lexemes/lexeme-forms/lexeme-forms.component'
import { YesNoDialogComponent } from './_components/yes-no-dialog/yes-no-dialog.component'
import { FilterMenuComponent } from './lexemes/filter-menu/filter-menu.component'
import { ErrorsDialogComponent } from './_components/errors-dialog/errors-dialog.component'
import { LinkTypeComponent } from './link-type/link-type.component'
import { TabMappingsComponent } from './lexemes/tab-4-mappings/tab-mappings.component'
import { TabHistoryComponent } from './lexemes/tab-history/tab-history.component'
import { SynGroupLinkComponent } from './_components/syn-group-link/syn-group-link.component'
import { SememeLinkComponent } from './_components/sememe-link/sememe-link.component'
import { HierarchicalSelectComponent } from './_components/hierarchical-select/hierarchical-select.component'
import { DialectsSelectComponent } from './_components/dialects-select/dialects-select.component'

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }]

// Dit is veal beater as en eigen material.module.ts to bruken:
// Bruukt eyn a.b. lazy loading, so kan eyn in elk module dat laden wat eyn dår ouk
// innedåd bruukt un laadt nich in alle modulen allens uut dat material.module.ts
const material = [
	DragDropModule,
	MatAutocompleteModule,
	MatBadgeModule,
	MatButtonModule,
	MatButtonToggleModule,
	MatCardModule,
	MatCheckboxModule,
	MatChipsModule,
	MatDialogModule,
	MatFormFieldModule,
	MatIconModule,
	MatInputModule,
	MatListModule,
	MatMenuModule,
	MatPaginatorModule,
	MatProgressSpinnerModule,
	MatRadioModule,
	MatSelectModule,
	MatSidenavModule,
	MatSlideToggleModule,
	MatSnackBarModule,
	MatSortModule,
	MatTableModule,
	MatTabsModule,
	MatToolbarModule,
	MatTooltipModule,
	NgxMatSelectSearchModule,
]

@NgModule({
	imports: [
		BlockUIModule.forRoot({
			delayStart: 500,
			//delayStop: 500,
		}),
		CommonModule,
		AdminRoutingModule,
		material,
		FormsModule,
		ReactiveFormsModule,
		// Directives
		DisableControlDirective,
		// Components
		AdminComponent,
		SideMenuComponent,
		OrthographyComponent,
		NavMenuComponent,
		NavItemComponent,
		UiLanguageComponent,
		UiScopeComponent,
		UiTranslationComponent,
		UiResultCategoryComponent,
		LanguageComponent,
		LangPairComponent,
		LangOrthoMappingComponent,
		LexemeTypeComponent,
		LexemeFormTypeComponent,
		UnitLevelComponent,
		CategoryComponent,
		ViewComponent,
		ListComponent,
		EditorComponent,
		LexemeLinkComponent,
		TabGeneralComponent,
		TabVariantsComponent,
		TabSememesComponent,
		TabLinksComponent,
		TabCommentsComponent,
		OtherTranslationsComponent,
		DisableFormComponent,
		LexemeFormComponent,
		LemmaTemplateComponent,
		TypeLanguageConfigComponent,
		FormTypePositionsDialog,
		LexemeFormsComponent,
		YesNoDialogComponent,
		FilterMenuComponent,
		ErrorsDialogComponent,
		LinkTypeComponent,
		TabMappingsComponent,
		TabHistoryComponent,
		SynGroupLinkComponent,
		SememeLinkComponent,
		HierarchicalSelectComponent,
		DialectsSelectComponent,
	],
	providers: [
		httpInterceptorProviders,
		{ provide: TRANSLOCO_SCOPE, useValue: 'admin' },
		DataService,
		LexemeQueryService,
		LexemeService,
		SememeService,
		SynGroupQueryService,
		LockService,
		NavigationService,
		provideHttpClient(withInterceptorsFromDi()),
	],
})
export class AdminModule {}
