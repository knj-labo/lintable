import proofdictRule from '@proofdict/textlint-rule-proofdict';
import { TextlintKernel } from '@textlint/kernel';
import jaPreset from 'textlint-rule-preset-ja-technical-writing';
import type { LintOptions, LintResult, RuleLevel } from '../shared/types';
import { createLRUCache, createLintCacheKey } from '../shared/utils/cache';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('TextlintService');

export interface TextlintService {
  initialize: () => Promise<void>;
  lintText: (options: LintOptions) => Promise<LintResult[]>;
  clearCache: () => void;
  pruneCache: () => void;
}

function createTextlintService(): TextlintService {
  const kernel = new TextlintKernel();
  const cache = createLRUCache<LintResult[]>();
  let isInitialized = false;

  const initialize = async (): Promise<void> => {
    if (isInitialized) return;

    try {
      logger.info('Initializing Textlint service');
      // Perform any async initialization if needed
      isInitialized = true;
      logger.info('Textlint service initialized');
    } catch (error) {
      logger.error('Failed to initialize Textlint service', error);
      throw error;
    }
  };

  // biome-ignore lint/suspicious/noExplicitAny: Required due to TextlintKernel type incompatibility
  const getRulesForLevel = (level: RuleLevel): any[] => {
    // biome-ignore lint/suspicious/noExplicitAny: Required due to TextlintKernel type incompatibility
    const rules: any[] = [];

    switch (level) {
      case 'L0':
        rules.push({
          ruleId: 'proofdict',
          rule: proofdictRule,
        });
        break;

      case 'L1':
        rules.push({
          ruleId: 'proofdict',
          rule: proofdictRule,
        });
        rules.push({
          ruleId: 'ja-technical-writing/no-mix-dearu-desumasu',
          rule: jaPreset.rules['ja-technical-writing/no-mix-dearu-desumasu'],
        });
        break;

      case 'L2':
        rules.push({
          ruleId: 'proofdict',
          rule: proofdictRule,
        });
        rules.push({
          ruleId: 'ja-technical-writing/no-mix-dearu-desumasu',
          rule: jaPreset.rules['ja-technical-writing/no-mix-dearu-desumasu'],
        });
        rules.push({
          ruleId: 'ja-technical-writing/sentence-length',
          rule: jaPreset.rules['ja-technical-writing/sentence-length'],
        });
        break;

      default: // L3
        rules.push({
          ruleId: 'proofdict',
          rule: proofdictRule,
        });
        for (const [ruleId, rule] of Object.entries(jaPreset.rules)) {
          rules.push({
            ruleId: `ja-technical-writing/${ruleId.replace('ja-technical-writing/', '')}`,
            rule,
          });
        }
        break;
    }

    return rules;
  };

  const lintText = async (options: LintOptions): Promise<LintResult[]> => {
    const { text, ruleLevel, ext = '.txt' } = options;

    // Check cache
    const cacheKey = createLintCacheKey(text, ruleLevel);
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached lint results', { ruleLevel, textLength: text.length });
      return cached;
    }

    try {
      logger.debug('Starting lint', { ruleLevel, textLength: text.length });

      const result = await kernel.lintText(text, {
        rules: getRulesForLevel(ruleLevel),
        ext,
      });

      const lintResults: LintResult[] = result.messages.map((msg) => ({
        line: msg.line ?? 1,
        column: msg.column ?? 1,
        message: msg.message ?? '',
        ruleId: msg.ruleId ?? 'unknown',
        severity: msg.severity ?? 1,
        fix: msg.fix
          ? {
              range: msg.fix.range as [number, number],
              text: msg.fix.text,
            }
          : undefined,
      }));

      // Cache results
      cache.set(cacheKey, lintResults);

      logger.info('Lint completed', {
        ruleLevel,
        textLength: text.length,
        resultsCount: lintResults.length,
      });

      return lintResults;
    } catch (error) {
      logger.error('Lint failed', error);
      throw error;
    }
  };

  const clearCache = (): void => {
    cache.clear();
    logger.debug('Cache cleared');
  };

  const pruneCache = (): void => {
    cache.prune();
    logger.debug('Cache pruned');
  };

  return {
    initialize,
    lintText,
    clearCache,
    pruneCache,
  };
}

// Singleton instance
let textlintService: TextlintService | null = null;

export function getTextlintService(): TextlintService {
  if (!textlintService) {
    textlintService = createTextlintService();
  }
  return textlintService;
}
