import { CONTEXT_MENU_IDS, EXTENSION_NAME } from '../shared/constants';
import type { ChromeMessage } from '../shared/types';
import { createLogger } from '../shared/utils/logger';
import { getMessageHandler } from './message-handler';
import { getTextlintService } from './textlint-service';

const logger = createLogger('Background');
const messageHandler = getMessageHandler();
const textlintService = getTextlintService();

// Initialize extension
logger.info(`${EXTENSION_NAME} service worker started`);

// Handle extension installation
chrome.runtime.onInstalled.addListener(async () => {
  logger.info('Extension installed');

  try {
    // Initialize textlint service
    await textlintService.initialize();

    // Create context menu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.LINT,
      title: 'Lintableで校正',
      contexts: ['selection'],
    });

    logger.info('Context menu created');
  } catch (error) {
    logger.error('Failed to initialize extension', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_IDS.LINT && info.selectionText && tab?.id) {
    logger.debug('Context menu clicked', {
      text: `${info.selectionText.substring(0, 50)}...`,
    });

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_OVERLAY',
      payload: {
        text: info.selectionText,
        ruleLevel: 'L1',
      },
    } as ChromeMessage);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  // Handle message asynchronously
  messageHandler
    .handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      logger.error('Message handling failed', error);
      sendResponse({
        error: error.message || 'Unknown error occurred',
      });
    });

  // Return true to indicate async response
  return true;
});

// Periodic cache cleanup
setInterval(
  () => {
    textlintService.pruneCache();
    logger.debug('Cache pruned');
  },
  5 * 60 * 1000,
); // Every 5 minutes

// Export for testing
export { messageHandler, textlintService };
