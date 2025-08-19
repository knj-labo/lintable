// Extension Constants
export const EXTENSION_NAME = 'Lintable';
export const EXTENSION_VERSION = '0.0.1';

// Storage Keys
export const STORAGE_KEYS = {
  USER_CONFIG: 'lintable_user_config',
  LINT_CACHE: 'lintable_lint_cache',
  LAST_LINT: 'lintable_last_lint',
} as const;

// DOM IDs and Classes
export const DOM_IDS = {
  ROOT_CONTAINER: 'lintable-root',
  OVERLAY: 'lintable-overlay',
  TOGGLE_BUTTON: 'lintable-toggle',
  RESULTS_CONTAINER: 'lintable-results',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.VITE_API_URL || 'http://localhost:8787',
  CONTENT: '/content',
  SAVE_DRAFT: '/save-draft',
  RULES: '/rules',
} as const;

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

// Rule Levels Configuration
export const RULE_LEVELS = {
  L0: {
    name: 'Minimal',
    description: '重大なエラーのみ',
    color: '#4CAF50',
  },
  L1: {
    name: 'Basic',
    description: '一般的なスタイル',
    color: '#2196F3',
  },
  L2: {
    name: 'Standard',
    description: '技術文書向け',
    color: '#FF9800',
  },
  L3: {
    name: 'Strict',
    description: 'すべてのルール',
    color: '#F44336',
  },
} as const;

// Chrome Context Menu IDs
export const CONTEXT_MENU_IDS = {
  LINT: 'lintable-lint',
  SETTINGS: 'lintable-settings',
} as const;

// Event Names
export const EVENTS = {
  LINT_START: 'lintable:lint:start',
  LINT_COMPLETE: 'lintable:lint:complete',
  LINT_ERROR: 'lintable:lint:error',
  OVERLAY_OPEN: 'lintable:overlay:open',
  OVERLAY_CLOSE: 'lintable:overlay:close',
  CONFIG_UPDATE: 'lintable:config:update',
} as const;
