/**
 * Every localStorage key the app and the admin use, in one place.
 * The legacy scripts still write these keys directly; new code goes only through this registry.
 * When a backend appears, this is the list of entities to move to the API.
 */
export const StorageKeys = {
  /* общие для приложения и панели */
  theme: 'ui-theme',
  products: 'meb_products',
  shops: 'meb_shops',
  stories: 'meb_stories',
  storiesSeen: 'meb_stories_seen',
  promo: 'meb_promo',
  updatedAt: 'meb_updated',
  /* панель: импорт каталога */
  importMappings: 'meb_import_mappings',
  importHistory: 'meb_imports',
  /* покупатель */
  buyer: 'meb_buyer',
  cart: 'meb_cart',
  favorites: 'meb_favorites',
  marketplace: 'meb_marketplace',
  recentProducts: 'meb_pm_recent',
  onboarding: 'meb_onboarding',
  consent: 'meb_consent',
  onboardingOffset: 'meb_onb_offset',
  notificationsDismissed: 'meb_notif_dismissed',
  notificationsSeen: 'meb_notif_seen',
  pwaInstallDismissed: 'pwa_install_dismissed',
  /* справочник и контент */
  directory: 'meb_directory',
  showcases: 'meb_showcases',
  vacancies: 'meb_vacancies',
  lifehacks: 'meb_lifehacks',
  lifehackSaved: 'meb_lifehack_saved',
  lifehackChecks: 'meb_lh_checks',
  lifehackPollCounts: 'meb_lh_poll_counts',
  lifehackPollVotes: 'meb_lh_poll_votes',
  lifehackUsefulCounts: 'meb_lh_useful_counts',
  lifehackUsefulMine: 'meb_lh_useful_mine',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
