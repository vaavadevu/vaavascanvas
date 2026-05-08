CookieConsent.run({
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      equalWeightButtons: false,
    },
    preferencesModal: {
      layout: 'box',
    },
  },

  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
    },
    analytics: {
      autoClear: {
        cookies: [
          { name: /^_ga/ },
          { name: '_gid' },
        ],
      },
    },
  },

  language: {
    default: 'sv',
    autoDetect: 'browser',
    translations: {
      sv: {
        consentModal: {
          title: 'Vi använder cookies',
          description: 'Vi använder cookies för statistik och för att förbättra din upplevelse på sidan.',
          acceptAllBtn: 'Acceptera alla',
          acceptNecessaryBtn: 'Endast nödvändiga',
          showPreferencesBtn: 'Inställningar',
        },
        preferencesModal: {
          title: 'Cookieinställningar',
          acceptAllBtn: 'Acceptera alla',
          acceptNecessaryBtn: 'Endast nödvändiga',
          savePreferencesBtn: 'Spara',
          closeIconLabel: 'Stäng',
          sections: [
            {
              title: 'Nödvändiga cookies',
              description: 'Dessa cookies krävs för att webbplatsen ska fungera korrekt och kan inte inaktiveras.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Statistik',
              description: 'Hjälper oss förstå hur besökare använder webbplatsen via Google Analytics. Inga personuppgifter sparas.',
              linkedCategory: 'analytics',
            },
          ],
        },
      },
      en: {
        consentModal: {
          title: 'We use cookies',
          description: 'We use cookies for analytics and to improve your experience on the site.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Necessary only',
          showPreferencesBtn: 'Preferences',
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Necessary only',
          savePreferencesBtn: 'Save',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Necessary cookies',
              description: 'These cookies are required for the website to function correctly and cannot be disabled.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Analytics',
              description: 'Helps us understand how visitors use the website via Google Analytics. No personal data is stored.',
              linkedCategory: 'analytics',
            },
          ],
        },
      },
    },
  },
});
