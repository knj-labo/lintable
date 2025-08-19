import proofdictRule from '@proofdict/textlint-rule-proofdict';
import { TextlintKernel } from '@textlint/kernel';
import jaPreset from 'textlint-rule-preset-ja-technical-writing';

console.log('Lintable service worker started');

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8787';

// Textlint kernel instance
const kernel = new TextlintKernel();

// Rule level type
type RuleLevel = 'L0' | 'L1' | 'L2' | 'L3';

// Get rules configuration based on level
// biome-ignore lint/suspicious/noExplicitAny: Required due to TextlintKernel type incompatibility
const getRulesForLevel = (level: string): any[] => {
  // biome-ignore lint/suspicious/noExplicitAny: Required due to TextlintKernel type incompatibility
  const rules: any[] = [];

  // L0: Most permissive, L3: Most strict
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
    default:
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

// Lint text function
async function lintText(text: string, ruleLevel: RuleLevel = 'L1') {
  try {
    const result = await kernel.lintText(text, {
      rules: getRulesForLevel(ruleLevel),
      ext: '.txt',
    });

    return {
      type: 'result',
      messages: result.messages.map((msg) => ({
        line: msg.line ?? 1,
        column: msg.column ?? 1,
        message: msg.message ?? '',
        ruleId: msg.ruleId ?? 'unknown',
        severity: msg.severity ?? 1,
      })),
    };
  } catch (error) {
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Lintable installed');

  // コンテキストメニューを作成
  chrome.contextMenus.create({
    id: 'lintable-lint',
    title: 'Lintableで校正',
    contexts: ['selection'],
  });
});

// コンテキストメニューのクリックハンドラ
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lintable-lint' && info.selectionText && tab?.id) {
    // content scriptにメッセージを送信
    chrome.tabs.sendMessage(tab.id, {
      action: 'openOverlay',
      text: info.selectionText,
      ruleLevel: 'L1',
    });
  }
});

// API communication functions
async function fetchContent(url: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return null;
  }
}

async function saveDraft(content: { text: string; ruleLevel?: string }) {
  try {
    const response = await fetch(`${API_BASE_URL}/save-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save draft:', error);
    return null;
  }
}

async function fetchRules() {
  try {
    const response = await fetch(`${API_BASE_URL}/rules`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch rules:', error);
    return null;
  }
}

// Message handler for communication with content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'lint':
      // Lint text and send results back
      lintText(request.text, request.ruleLevel).then((result) => {
        // Send lint results to the content script
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'lintResult',
            ...result,
          });
        }
      });
      sendResponse({ status: 'processing' });
      return true;
    case 'fetchContent':
      fetchContent(request.url).then(sendResponse);
      return true;
    case 'saveDraft':
      saveDraft(request.content).then(sendResponse);
      return true;
    case 'fetchRules':
      fetchRules().then(sendResponse);
      return true;
    case 'updateContextMenu':
      // 選択テキストの有無でコンテキストメニューを更新
      chrome.contextMenus.update('lintable-lint', {
        enabled: request.hasSelection,
      });
      sendResponse({ status: 'updated' });
      break;
    default:
      sendResponse({ error: 'Unknown action' });
  }
  return true;
});
