// Textlint Types
export interface LintResult {
  line: number;
  column: number;
  message: string;
  ruleId: string;
  severity: number;
  fix?: {
    range: [number, number];
    text: string;
  };
}

export type RuleLevel = 'L0' | 'L1' | 'L2' | 'L3';

export interface LintOptions {
  text: string;
  ruleLevel: RuleLevel;
  ext?: string;
}

// Message Types for Chrome Extension Communication
export type MessageType =
  | 'LINT_REQUEST'
  | 'LINT_RESULT'
  | 'LINT_ERROR'
  | 'OPEN_OVERLAY'
  | 'CLOSE_OVERLAY'
  | 'UPDATE_CONTEXT_MENU'
  | 'FETCH_CONTENT'
  | 'SAVE_DRAFT'
  | 'FETCH_RULES'
  | 'CONFIG_UPDATE'
  | 'CONFIG_GET';

export interface BaseMessage {
  type: MessageType;
  timestamp?: number;
  id?: string;
}

export interface LintRequestMessage extends BaseMessage {
  type: 'LINT_REQUEST';
  payload: LintOptions;
}

export interface LintResultMessage extends BaseMessage {
  type: 'LINT_RESULT';
  payload: {
    results: LintResult[];
    text: string;
    ruleLevel: RuleLevel;
  };
}

export interface LintErrorMessage extends BaseMessage {
  type: 'LINT_ERROR';
  payload: {
    error: string;
    details?: unknown;
  };
}

export interface OverlayMessage extends BaseMessage {
  type: 'OPEN_OVERLAY' | 'CLOSE_OVERLAY';
  payload?: {
    text?: string;
    ruleLevel?: RuleLevel;
  };
}

export interface ContextMenuMessage extends BaseMessage {
  type: 'UPDATE_CONTEXT_MENU';
  payload: {
    hasSelection: boolean;
  };
}

export interface ConfigMessage extends BaseMessage {
  type: 'CONFIG_UPDATE' | 'CONFIG_GET';
  payload?: UserConfig;
}

export type ChromeMessage =
  | LintRequestMessage
  | LintResultMessage
  | LintErrorMessage
  | OverlayMessage
  | ContextMenuMessage
  | ConfigMessage;

// Configuration Types
export interface UserConfig {
  theme: 'light' | 'dark' | 'auto';
  defaultRuleLevel: RuleLevel;
  autoLint: boolean;
  debounceDelay: number;
  maxResults: number;
  enableNotifications: boolean;
  customRules?: Record<string, unknown>;
}

export const DEFAULT_CONFIG: UserConfig = {
  theme: 'auto',
  defaultRuleLevel: 'L1',
  autoLint: false,
  debounceDelay: 500,
  maxResults: 100,
  enableNotifications: true,
};

// UI Types
export interface OverlayState {
  isOpen: boolean;
  results: LintResult[];
  currentLevel: RuleLevel;
  isLoading: boolean;
  error?: string;
}

export interface ButtonState {
  isVisible: boolean;
  hasErrors: boolean;
  badge?: string | number;
}

// Error Types
export interface LintableError extends Error {
  code: string;
  details?: unknown;
}

export function createLintableError(
  message: string,
  code: string,
  details?: unknown,
): LintableError {
  const error = new Error(message) as LintableError;
  error.name = 'LintableError';
  error.code = code;
  error.details = details;
  return error;
}

export enum ErrorCode {
  LINT_FAILED = 'LINT_FAILED',
  WORKER_ERROR = 'WORKER_ERROR',
  MESSAGE_ERROR = 'MESSAGE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> = T extends (
  ...args: unknown[]
) => Promise<infer R>
  ? R
  : never;
