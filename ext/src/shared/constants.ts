export const EXTENSION_NAME = 'Lintable';

// Timing Constants
export const TIMING = {
  DEBOUNCE_DELAY: 500,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  ANIMATION_DURATION: 300,
} as const;

// Limits
export const LIMITS = {
  MAX_TEXT_LENGTH: 50000,
  MAX_RESULTS: 100,
  MAX_CACHE_SIZE: 50,
} as const;

// Chrome Context Menu IDs
export const CONTEXT_MENU_IDS = {
  LINT: 'lintable-lint',
  SETTINGS: 'lintable-settings',
} as const;
