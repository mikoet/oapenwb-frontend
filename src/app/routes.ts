// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { RouteDesc } from '@app/shared/_helpers/route-desc';
import { allRoutesMap } from '@app/shared/all-routes-map';

// Query params for route ROUTE_TABLE_VIEW
export const QP_TABLE_VIEW_PAIR = 'pår';
export const QP_TABLE_VIEW_DIRECTION = 'richt';
export const QP_TABLE_VIEW_TERM = 'term';


//export const ROUTE_DICT: RouteDesc = { path: '' /* could be 'dict' or 'dictionary' */ }
export const ROUTE_DICT: RouteDesc = new RouteDesc({ id: 'dict', path: '' }, allRoutesMap);
export const ROUTE_TABLE_VIEW: RouteDesc = new RouteDesc({ id: 'table', path: 'tabel', parent: ROUTE_DICT }, allRoutesMap);

export const ROUTE_SIGN_ON: RouteDesc = new RouteDesc({id: 'sign-on', path: 'bruker'}, allRoutesMap);
export const ROUTE_LOGIN: RouteDesc = new RouteDesc({ id: 'login', path: 'inloggen', parent: ROUTE_SIGN_ON }, allRoutesMap);
export const ROUTE_REGISTER: RouteDesc = new RouteDesc({ id: 'register', path: 'registreren', parent: ROUTE_SIGN_ON }, allRoutesMap);
export const ROUTE_FORGOT_PW: RouteDesc = new RouteDesc({ id: 'forgot-password', path: 'paswoord-vorgeyten', parent: ROUTE_SIGN_ON }, allRoutesMap);

export const ROUTE_ADMIN: RouteDesc = new RouteDesc({ id: 'admin', path: 'admin' }, allRoutesMap);
// Admin begin
// TODO think about sourcing these admin routes out into a seperate file for admin routes in admin directory/module
export const ROUTE_ADMIN_ORTHO: RouteDesc = new RouteDesc({ id: 'ortho', path: 'orthographies', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LANG: RouteDesc = new RouteDesc({ id: 'lang', path: 'languages', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LANGPAIR: RouteDesc = new RouteDesc({ id: 'langpair', path: 'language-pairs', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LANGORTHOMAPPING: RouteDesc = new RouteDesc({ id: 'langorthomapping', path: 'language-orthography-mappings', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LEXEMETYPE: RouteDesc = new RouteDesc({ id: 'lexemeType', path: 'lexeme-types', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LEXEMEFORMTYPE: RouteDesc = new RouteDesc({ id: 'lexemeFormType', path: 'lexeme-form-types', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_TYPELANGUAGECONFIG: RouteDesc = new RouteDesc({ id: 'typeLangConfig', path: 'type-lang-configs', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LEMMATEMPLATE: RouteDesc = new RouteDesc({ id: 'lemmaTemplate', path: 'lemma-templates', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_UNITLEVEL: RouteDesc = new RouteDesc({ id: 'unitLevel', path: 'unit-levels', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_CATEGORY: RouteDesc = new RouteDesc({ id: 'category', path: 'categories', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_LEXEME: RouteDesc = new RouteDesc({ id: 'lexeme', path: 'lexemes', parent: ROUTE_ADMIN }, allRoutesMap);

export const ROUTE_ADMIN_UILANG: RouteDesc = new RouteDesc({ id: 'uilang', path: 'ui-languages', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_UISCOPE: RouteDesc = new RouteDesc({ id: 'uiscope', path: 'ui-scopes', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_UITRANSLATION: RouteDesc = new RouteDesc({ id: 'uitranslation', path: 'ui-translations', parent: ROUTE_ADMIN }, allRoutesMap);
export const ROUTE_ADMIN_UIRESULTCATEGORY: RouteDesc = new RouteDesc({ id: 'uiresultcategory', path: 'ui-result-categories', parent: ROUTE_ADMIN }, allRoutesMap);
// Admin end

export const ROUTE_DUTIES: RouteDesc = new RouteDesc({ id: 'duties', path: 'plichtangåven' }, allRoutesMap);
export const ROUTE_DATA_PRIVACY: RouteDesc = new RouteDesc({ id: 'data-privacy', path: 'datenskuul', parent: ROUTE_DUTIES }, allRoutesMap);
export const ROUTE_TERMS_OF_USE: RouteDesc = new RouteDesc({ id: 'terms-of-use', path: 'gebruuksbedingings', parent: ROUTE_DUTIES }, allRoutesMap); // Nutzungsbedingungen
export const ROUTE_IMPRINT: RouteDesc = new RouteDesc({ id: 'imprint', path: 'impressum', parent: ROUTE_DUTIES }, allRoutesMap);
