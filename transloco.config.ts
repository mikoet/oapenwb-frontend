import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';

/**
 * Config for transloco keys manager (?)
 */
const config: TranslocoGlobalConfig = {
	rootTranslationsPath: 'src/assets/i18n/',
	langs: ['en', 'de', 'nds'],
	defaultLang: 'en',
	keysManager: {},
};

export default config;
