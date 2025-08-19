import { CONTEXT_MENU_IDS } from '../shared/constants';
import {
  type ChromeMessage,
  ErrorCode,
  type LintErrorMessage,
  type LintResultMessage,
  type UserConfig,
  createLintableError,
} from '../shared/types';
import { createLogger } from '../shared/utils/logger';
import { getTextlintService } from './textlint-service';

const logger = createLogger('MessageHandler');

export interface MessageHandler {
  handleMessage: (message: ChromeMessage, sender: chrome.runtime.MessageSender) => Promise<unknown>;
}

function createMessageHandler(): MessageHandler {
  const textlintService = getTextlintService();

  const handleMessage = async (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<unknown> => {
    logger.debug('Received message', { type: message.type, senderId: sender.id });

    try {
      switch (message.type) {
        case 'LINT_REQUEST':
          return await handleLintRequest(message, sender);

        case 'UPDATE_CONTEXT_MENU':
          return await handleContextMenuUpdate(message);

        case 'CONFIG_GET':
          return await handleConfigGet();

        case 'CONFIG_UPDATE':
          return await handleConfigUpdate(message);

        default:
          logger.warn('Unknown message type', { type: message.type });
          return { error: 'Unknown message type' };
      }
    } catch (error) {
      logger.error('Message handling failed', error);

      const errorMessage: LintErrorMessage = {
        type: 'LINT_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };

      // Send error back to content script if we have a tab
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, errorMessage);
      }

      throw error;
    }
  };

  const handleLintRequest = async (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<void> => {
    if (message.type !== 'LINT_REQUEST') return;

    const { text, ruleLevel } = message.payload;

    try {
      // Initialize service if needed
      await textlintService.initialize();

      // Perform lint
      const results = await textlintService.lintText({
        text,
        ruleLevel,
      });

      // Send results back to content script
      const resultMessage: LintResultMessage = {
        type: 'LINT_RESULT',
        payload: {
          results,
          text,
          ruleLevel,
        },
      };

      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, resultMessage);
      }

      logger.info('Lint results sent', {
        tabId: sender.tab?.id,
        resultsCount: results.length,
      });
    } catch (error) {
      throw createLintableError('Failed to process lint request', ErrorCode.LINT_FAILED, error);
    }
  };

  const handleContextMenuUpdate = async (message: ChromeMessage): Promise<{ status: string }> => {
    if (message.type !== 'UPDATE_CONTEXT_MENU') return { status: 'ignored' };

    const { hasSelection } = message.payload;

    try {
      await chrome.contextMenus.update(CONTEXT_MENU_IDS.LINT, {
        enabled: hasSelection,
      });

      logger.debug('Context menu updated', { hasSelection });
      return { status: 'updated' };
    } catch (error) {
      logger.error('Failed to update context menu', error);
      throw createLintableError('Failed to update context menu', ErrorCode.MESSAGE_ERROR, error);
    }
  };

  const handleConfigGet = async (): Promise<UserConfig | Record<string, never>> => {
    try {
      const result = await chrome.storage.sync.get('userConfig');
      return result.userConfig || {};
    } catch (error) {
      logger.error('Failed to get config', error);
      throw createLintableError('Failed to get configuration', ErrorCode.CONFIG_ERROR, error);
    }
  };

  const handleConfigUpdate = async (message: ChromeMessage): Promise<{ status: string }> => {
    if (message.type !== 'CONFIG_UPDATE') return { status: 'ignored' };

    try {
      await chrome.storage.sync.set({ userConfig: message.payload });
      logger.info('Configuration updated');
      return { status: 'updated' };
    } catch (error) {
      logger.error('Failed to update config', error);
      throw createLintableError('Failed to update configuration', ErrorCode.CONFIG_ERROR, error);
    }
  };

  return {
    handleMessage,
  };
}

// Singleton instance
let messageHandler: MessageHandler | null = null;

export function getMessageHandler(): MessageHandler {
  if (!messageHandler) {
    messageHandler = createMessageHandler();
  }
  return messageHandler;
}
