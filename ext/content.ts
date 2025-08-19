import { getOverlay, initOverlay } from './overlay';
import type { LintResult, RuleLevel } from './overlay';

console.log('Lintable content script loaded');

// オーバーレイUIを初期化
const overlay = initOverlay();

// Lint text function - send request to background script
function lintText(text: string, ruleLevel: RuleLevel = 'L1') {
  chrome.runtime.sendMessage({
    action: 'lint',
    text,
    ruleLevel,
  });
}

// オーバーレイのコールバックを設定
if (overlay) {
  // テキスト選択時のコールバック
  overlay.onTextSelected = (text: string) => {
    lintText(text, 'L1');
  };

  // ルールレベル変更時のコールバック
  overlay.onLevelChange = (level: RuleLevel) => {
    // 現在選択されているテキストを再校正
    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
      lintText(selectedText, level);
    }
  };
}

// コンテキストメニューに「Lintableで校正」を追加
document.addEventListener('contextmenu', () => {
  const selectedText = window.getSelection()?.toString();
  if (selectedText) {
    // Chrome拡張のコンテキストメニューAPIはbackground.tsで処理
    chrome.runtime.sendMessage({
      action: 'updateContextMenu',
      hasSelection: true,
    });
  }
});

// 選択テキストの変更を監視
document.addEventListener('selectionchange', () => {
  const selectedText = window.getSelection()?.toString();
  chrome.runtime.sendMessage({
    action: 'updateContextMenu',
    hasSelection: !!selectedText,
  });
});

// Background scriptからのメッセージを処理（既存のlintResultハンドラーと統合）
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case 'lintResult': {
      const { type, messages } = request;
      if (type === 'result') {
        console.log('Lint results:', messages);
        // オーバーレイに結果を表示
        const overlayForResults = getOverlay();
        if (overlayForResults && messages) {
          overlayForResults.updateResults(messages as LintResult[]);
        }
      } else if (type === 'error') {
        console.error('Lint error:', request.error);
      }
      break;
    }
    case 'lint':
      lintText(request.text, request.ruleLevel);
      sendResponse({ status: 'processing' });
      break;
    case 'openOverlay': {
      const overlay = getOverlay();
      if (overlay) {
        overlay.open();
        const selectedText = window.getSelection()?.toString() || request.text;
        if (selectedText) {
          lintText(selectedText, request.ruleLevel || 'L1');
        }
      }
      sendResponse({ status: 'opened' });
      break;
    }
    case 'closeOverlay': {
      const overlayToClose = getOverlay();
      if (overlayToClose) {
        overlayToClose.close();
      }
      sendResponse({ status: 'closed' });
      break;
    }
  }
  return true;
});
