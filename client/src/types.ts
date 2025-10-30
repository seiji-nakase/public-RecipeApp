/*
実行例: npm run dev
概要: フロントエンドで共有する型定義をまとめるユーティリティモジュール。
*/

export type Recipe = {
  id: number;
  title: string;
  ingredients: string;
  steps: string;
  notes: string;
};
