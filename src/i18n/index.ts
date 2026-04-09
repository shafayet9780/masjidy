import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import bn from './bn.json';
import en from './en.json';
import ur from './ur.json';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    bn: { translation: bn },
    ur: { translation: ur },
  },
  lng: Localization.getLocales()[0]?.languageCode ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export { i18n };
