module.exports = {
	rootTranslationsPath: 'src/assets/i18n/',
	langs: ['en', 'de', 'nds'],
	defaultLang: 'en',
	fallbackLang: 'en',
	missingHandler: {
		// It will use the first language set in the `fallbackLang` property
		useFallbackTranslation: true
	},
	keysManager: {}
};