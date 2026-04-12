/** Expo Router param types */

export type RootStackParams = {
  '(tabs)': undefined;
  'mosque/[id]': { id: string };
  'auth/login': undefined;
  'auth/onboarding': undefined;
  'submit-time/[mosqueId]': { mosqueId: string; prayer?: string };
  'settings/index': undefined;
  'settings/theme': undefined;
  'settings/notifications': undefined;
  'settings/language': undefined;
};
