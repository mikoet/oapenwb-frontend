import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';

const config: TranslocoGlobalConfig = {
	rootTranslationsPath: 'src/assets/i18n/',
	langs: ['en', 'de', 'nds'],
	defaultLang: 'en',
	keysManager: {},
};

export default config;
