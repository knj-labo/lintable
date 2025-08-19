// CSS Modules用の型定義
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// 通常のCSSファイル
declare module '*.css' {
  const content: string;
  export default content;
}
