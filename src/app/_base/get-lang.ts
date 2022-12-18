// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { DEFAULT_UI_LOCALE } from "@app/_config/config";

export function getLang(): string {
	const locale = localStorage.getItem('dict.ui_locale');
	if (!!locale) {
		return locale;
	}
	return DEFAULT_UI_LOCALE;
}
