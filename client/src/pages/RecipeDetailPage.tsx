/*
実行例: npm run dev
概要: レシピの詳細情報を閲覧するページ。編集や削除ページと同様のレイアウトで表示する。
*/

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Recipe } from "../types";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("レシピIDが指定されていません。");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/recipes/${id}`, {
          credentials: "include",
        });

        if (response.status === 401) {
          throw new Error("ログインが必要です。");
        }

        if (response.status === 404) {
          throw new Error("指定したレシピが見つかりません。");
        }

        if (!response.ok) {
          throw new Error("レシピ情報の取得に失敗しました。");
        }

        const data: Recipe = await response.json();
        setRecipe(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("未知のエラーが発生しました。");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">レシピ詳細</h1>
        <p className="text-sm text-slate-600">登録済みのレシピ情報を確認できます。</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {recipe && (
        <div className="space-y-4 rounded border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">料理名</h4>
            <p className="text-base text-slate-900">{recipe.title}</p>
          </section>
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">材料</h4>
            <p className="whitespace-pre-line">{recipe.ingredients || "(未入力)"}</p>
          </section>
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">手順</h4>
            <p className="whitespace-pre-line">{recipe.steps || "(未入力)"}</p>
          </section>
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">備考</h4>
            <p className="whitespace-pre-line">{recipe.notes || "(未入力)"}</p>
          </section>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm font-medium">
        {id && (
          <Link
            to={`/recipes/${id}/edit`}
            className="rounded border border-slate-200 px-3 py-2 text-slate-700 hover:border-slate-300 hover:text-slate-900"
          >
            編集する
          </Link>
        )}
        <Link to="/" className="text-slate-600 underline">
          一覧に戻る
        </Link>
      </div>
    </section>
  );
};

export default RecipeDetailPage;
