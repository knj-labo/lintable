import styles from './overlay.module.css';

export interface LintResult {
  line: number;
  column: number;
  message: string;
  ruleId: string;
  severity: number;
}

export type RuleLevel = 'L0' | 'L1' | 'L2' | 'L3';

export interface LintableOverlay {
  updateResults: (results: LintResult[]) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  onTextSelected: (text: string) => void;
  onLevelChange: (level: RuleLevel) => void;
  destroy: () => void;
}

function createLintableOverlay(): LintableOverlay {
  let container: HTMLElement | null = null;
  let shadow: ShadowRoot | null = null;
  let overlay: HTMLElement | null = null;
  let toggleButton: HTMLElement | null = null;
  let isOpen = false;
  let results: LintResult[] = [];
  let currentLevel: RuleLevel = 'L1';

  const getCSSModulesStyles = (): string => {
    // CSS Modulesのハッシュ付きクラス名に対応したCSSを返す
    // 実際のCSSをハッシュ付きクラス名で置換
    const cssWithHashedClasses = `
      .${styles.overlay} {
        position: fixed;
        top: 0;
        right: -320px;
        width: 320px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        transition: right 0.3s ease;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .${styles.overlayActive} {
        right: 0;
      }
      
      .${styles.header} {
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .${styles.title} {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      
      .${styles.closeButton} {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .${styles.closeButton}:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .${styles.content} {
        padding: 16px;
        height: calc(100vh - 60px);
        overflow-y: auto;
      }
      
      .${styles.levelSelector} {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 16px;
        font-size: 14px;
        background: white;
      }
      
      .${styles.levelLabel} {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .${styles.results} {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .${styles.resultItem} {
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        transition: box-shadow 0.2s;
      }
      
      .${styles.resultItem}:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .${styles.severityWarning} {
        border-left: 4px solid #ffd700;
      }
      
      .${styles.severityError} {
        border-left: 4px solid #ff6b6b;
      }
      
      .${styles.resultLocation} {
        font-size: 11px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .${styles.resultMessage} {
        font-size: 14px;
        color: #333;
        line-height: 1.4;
      }
      
      .${styles.resultRule} {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
        font-style: italic;
      }
      
      .${styles.toggleButton} {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: transform 0.2s;
      }
      
      .${styles.toggleButton}:hover {
        transform: scale(1.1);
      }
      
      .${styles.toggleButton}:active {
        transform: scale(0.95);
      }
      
      .${styles.emptyState} {
        text-align: center;
        padding: 40px 20px;
        color: #999;
      }
      
      .${styles.emptyStateIcon} {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .${styles.emptyStateText} {
        font-size: 14px;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .${styles.overlay} {
          background: #1a1a1a;
          color: #e0e0e0;
        }
        
        .${styles.levelSelector} {
          background: #2a2a2a;
          color: #e0e0e0;
          border-color: #444;
        }
        
        .${styles.resultItem} {
          background: #2a2a2a;
          border-color: #444;
        }
        
        .${styles.resultMessage} {
          color: #e0e0e0;
        }
        
        .${styles.resultLocation} {
          color: #888;
        }
        
        .${styles.resultRule} {
          color: #999;
        }
      }
    `;

    return cssWithHashedClasses;
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const renderResults = (): string => {
    if (results.length === 0) {
      return `
        <div class="${styles.emptyState}">
          <div class="${styles.emptyStateIcon}">📝</div>
          <div class="${styles.emptyStateText}">
            テキストを選択して校正を開始してください
          </div>
        </div>
      `;
    }

    return `
      <ul class="${styles.results}">
        ${results
          .map(
            (result) => `
          <li class="${styles.resultItem} ${result.severity === 2 ? styles.severityError : styles.severityWarning}">
            <div class="${styles.resultLocation}">行 ${result.line}, 列 ${result.column}</div>
            <div class="${styles.resultMessage}">${escapeHtml(result.message)}</div>
            <div class="${styles.resultRule}">${result.ruleId}</div>
          </li>
        `,
          )
          .join('')}
      </ul>
    `;
  };

  const setupEventListeners = () => {
    if (!shadow) return;

    const closeBtn = shadow.getElementById('close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => close());
    }

    const levelSelector = shadow.getElementById('level-selector') as HTMLSelectElement | null;
    if (levelSelector) {
      levelSelector.addEventListener('change', (e) => {
        currentLevel = (e.target as HTMLSelectElement).value as RuleLevel;
        onLevelChange(currentLevel);
      });
    }
  };

  const createToggleButton = () => {
    toggleButton = document.createElement('button');
    toggleButton.className = styles.toggleButton;
    toggleButton.innerHTML = '✓';
    toggleButton.title = 'Lintable - 文章校正';
    toggleButton.addEventListener('click', () => toggle());
    document.body.appendChild(toggleButton);
  };

  const createOverlay = () => {
    // Shadow DOMでスタイルを隔離
    container = document.createElement('div');
    container.id = 'lintable-root';
    shadow = container.attachShadow({ mode: 'closed' });

    // CSS Modulesのスタイルを注入
    const style = document.createElement('style');
    style.textContent = getCSSModulesStyles();
    shadow.appendChild(style);

    // オーバーレイUI構築
    overlay = document.createElement('div');
    overlay.className = styles.overlay;

    overlay.innerHTML = `
      <div class="${styles.header}">
        <h1 class="${styles.title}">Lintable</h1>
        <button class="${styles.closeButton}" id="close-btn">✕</button>
      </div>
      <div class="${styles.content}">
        <label class="${styles.levelLabel}">校正レベル</label>
        <select class="${styles.levelSelector}" id="level-selector">
          <option value="L0">L0: 最小（重大なエラーのみ）</option>
          <option value="L1" selected>L1: 基本（一般的なスタイル）</option>
          <option value="L2">L2: 標準（技術文書向け）</option>
          <option value="L3">L3: 厳格（すべてのルール）</option>
        </select>
        <div id="results-container">
          ${renderResults()}
        </div>
      </div>
    `;

    shadow.appendChild(overlay);
    document.body.appendChild(container);

    // イベントリスナー設定
    setupEventListeners();
  };

  const updateResults = (newResults: LintResult[]) => {
    results = newResults;
    if (shadow) {
      const container = shadow.getElementById('results-container');
      if (container) {
        container.innerHTML = renderResults();
      }
    }
  };

  const open = () => {
    if (overlay) {
      overlay.classList.add(styles.overlayActive);
      isOpen = true;
    }
  };

  const close = () => {
    if (overlay) {
      overlay.classList.remove(styles.overlayActive);
      isOpen = false;
    }
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
      // 選択されたテキストを取得して校正
      const selectedText = window.getSelection()?.toString();
      if (selectedText) {
        onTextSelected(selectedText);
      }
    }
  };

  const onTextSelected = (text: string) => {
    // content.tsから呼ばれる
    console.log('Text selected for linting:', text);
  };

  const onLevelChange = (level: RuleLevel) => {
    // content.tsから呼ばれる
    console.log('Rule level changed:', level);
  };

  const destroy = () => {
    container?.remove();
    toggleButton?.remove();
  };

  // Initialize on creation
  createToggleButton();
  createOverlay();

  return {
    updateResults,
    open,
    close,
    toggle,
    onTextSelected,
    onLevelChange,
    destroy,
  };
}

// シングルトンインスタンス
let overlayInstance: LintableOverlay | null = null;

export function initOverlay(): LintableOverlay {
  if (!overlayInstance) {
    overlayInstance = createLintableOverlay();
  }
  return overlayInstance;
}

export function getOverlay(): LintableOverlay | null {
  return overlayInstance;
}
