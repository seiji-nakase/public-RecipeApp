/*
実行例: npm run build
概要: Tailwind CSSがスキャンするファイルとテーマ拡張を定義する設定。
*/

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
