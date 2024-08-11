// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { Routes } from '@angular/router'

import { AdminComponent } from './admin.component'

import { OrthographyComponent } from '@app/admin/orthography/orthography.component'
import { LanguageComponent } from '@app/admin/language/language.component'
import { LangPairComponent } from '@app/admin/lang-pair/lang-pair.component'
import { LangOrthoMappingComponent } from '@app/admin/lang-ortho-mapping/lang-ortho-mapping.component'
import { ViewComponent } from '@app/admin/lexemes/view/view.component'
import { LexemeTypeComponent } from '@app/admin/lexeme-type/lexeme-type.component'
import { LexemeFormTypeComponent } from '@app/admin/lexeme-form-type/lexeme-form-type.component'
import { UnitLevelComponent } from '@app/admin/unit-level/unit-level.component'
import { CategoryComponent } from '@app/admin/category/category.component'

import { UiLanguageComponent } from '@app/admin/ui-language/ui-language.component'
import { UiScopeComponent } from '@app/admin/ui-scope/ui-scope.component'
import { UiTranslationComponent } from '@app/admin/ui-translation/ui-translation.component'
import { UiResultCategoryComponent } from '@app/admin/ui-result-category/ui-result-category.component'

import {
	ROUTE_ADMIN_ORTHO,
	ROUTE_ADMIN_LANG,
	ROUTE_ADMIN_LANGPAIR,
	ROUTE_ADMIN_LANGORTHOMAPPING,
	ROUTE_ADMIN_LEXEME,
	ROUTE_ADMIN_LEXEMETYPE,
	ROUTE_ADMIN_LEXEMEFORMTYPE,
	ROUTE_ADMIN_LEMMATEMPLATE,
	ROUTE_ADMIN_UNITLEVEL,
	ROUTE_ADMIN_CATEGORY,
	ROUTE_ADMIN_UILANG,
	ROUTE_ADMIN_UISCOPE,
	ROUTE_ADMIN_UITRANSLATION,
	ROUTE_ADMIN_UIRESULTCATEGORY,
	ROUTE_ADMIN_TYPELANGUAGECONFIG,
} from '@app/routes'
import { LemmaTemplateComponent } from './lemma-template/lemma-template.component'
import { TypeLanguageConfigComponent } from './type-language-config/type-language-config.component'
import { TRANSLOCO_SCOPE } from '@jsverse/transloco'
import { DataService } from './_services/data.service'
import { LexemeQueryService } from './_services/lexeme-query.service'
import { LexemeService } from './_services/lexeme.service'
import { SememeService } from './_services/sememe.service'
import { SynGroupQueryService } from './_services/syn-group-query.service'
import { LockService } from './_services/lock.service'
import { NavigationService } from './navigation/navigation.service'

export const ADMIN_ROUTES: Routes = [
	{
		path: '',
		component: AdminComponent,
		children: [
			{ path: '', redirectTo: ROUTE_ADMIN_ORTHO.path, pathMatch: 'full' },

			{ path: ROUTE_ADMIN_ORTHO.path, component: OrthographyComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_LANG.path, component: LanguageComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_LANGPAIR.path, component: LangPairComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_LANGORTHOMAPPING.path, component: LangOrthoMappingComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_LEXEMETYPE.path, component: LexemeTypeComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_LEXEMEFORMTYPE.path, component: LexemeFormTypeComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_TYPELANGUAGECONFIG.path, component: TypeLanguageConfigComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_LEMMATEMPLATE.path, component: LemmaTemplateComponent, pathMatch: 'full' },

			{ path: ROUTE_ADMIN_UNITLEVEL.path, component: UnitLevelComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_CATEGORY.path, component: CategoryComponent, pathMatch: 'full' },

			{ path: ROUTE_ADMIN_LEXEME.path, component: ViewComponent, pathMatch: 'full' },

			{ path: ROUTE_ADMIN_UILANG.path, component: UiLanguageComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_UISCOPE.path, component: UiScopeComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_UITRANSLATION.path, component: UiTranslationComponent, pathMatch: 'full' },
			{ path: ROUTE_ADMIN_UIRESULTCATEGORY.path, component: UiResultCategoryComponent, pathMatch: 'full' },
		],
		providers: [
			{ provide: TRANSLOCO_SCOPE, useValue: 'admin' },

			DataService,
			LexemeQueryService,
			LexemeService,
			LockService,
			NavigationService,
			SememeService,
			SynGroupQueryService,
		],
	},
]
