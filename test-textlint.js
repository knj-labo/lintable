// textlintの動作確認スクリプト
// node test-textlint.js で実行

import proofdictRule from '@proofdict/textlint-rule-proofdict';
import { TextlintKernel } from '@textlint/kernel';
import jaPreset from 'textlint-rule-preset-ja-technical-writing';

const kernel = new TextlintKernel();

const testTexts = [
  {
    text: 'これはテストです。これはテストである。',
    level: 'L1',
    expected: 'です・である混在の警告',
  },
  {
    text: 'とても長い文章がここに書かれていて、一文が長すぎるという警告が出るはずの文章です。これは50文字を超える長い文章の例です。',
    level: 'L2',
    expected: '文章の長さ警告',
  },
  {
    text: 'これは正しい文章です。',
    level: 'L1',
    expected: 'エラーなし',
  },
];

const getRulesForLevel = (level) => {
  const baseRules = {
    proofdict: proofdictRule,
    ...jaPreset.rules,
  };

  switch (level) {
    case 'L0':
      return {
        proofdict: proofdictRule,
      };
    case 'L1':
      return {
        proofdict: proofdictRule,
        'ja-technical-writing/no-mix-dearu-desumasu':
          jaPreset.rules['ja-technical-writing/no-mix-dearu-desumasu'],
      };
    case 'L2':
      return {
        proofdict: proofdictRule,
        'ja-technical-writing/no-mix-dearu-desumasu':
          jaPreset.rules['ja-technical-writing/no-mix-dearu-desumasu'],
        'ja-technical-writing/sentence-length':
          jaPreset.rules['ja-technical-writing/sentence-length'],
      };
    default:
      return baseRules;
  }
};

async function testTextlint() {
  console.log('textlint動作テスト開始\n');

  for (const test of testTexts) {
    console.log(`テスト: ${test.expected}`);
    console.log(`テキスト: ${test.text}`);
    console.log(`レベル: ${test.level}`);

    try {
      const result = await kernel.lintText(test.text, {
        rules: getRulesForLevel(test.level),
        ext: '.txt',
      });

      if (result.messages.length > 0) {
        console.log('検出されたエラー:');
        for (const msg of result.messages) {
          console.log(`  - [${msg.ruleId}] ${msg.message} (行${msg.line}:列${msg.column})`);
        }
      } else {
        console.log('エラーなし ✓');
      }
    } catch (error) {
      console.error('エラー:', error.message);
    }

    console.log('---\n');
  }
}

testTextlint()
  .then(() => {
    console.log('テスト完了');
  })
  .catch((err) => {
    console.error('テスト失敗:', err);
  });
