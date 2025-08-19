// textlint関連の型定義
declare module 'textlint-rule-preset-ja-technical-writing' {
  interface TextlintRule {
    linter?: unknown;
    fixer?: unknown;
    [key: string]: unknown;
  }

  interface TextlintPreset {
    rules: {
      [key: string]: TextlintRule;
    };
    rulesConfig?: {
      [key: string]: unknown;
    };
  }

  const preset: TextlintPreset;
  export default preset;
}

// CSS Modulesの型定義
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Worker URLの型定義
declare module '*?worker' {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}

// 環境変数の型定義
declare namespace NodeJS {
  interface ProcessEnv {
    VITE_API_URL?: string;
  }
}
