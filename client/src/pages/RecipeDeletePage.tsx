/*
実行例: npm run dev
概要: レシピの詳細を確認し、`/api/recipes/:id`にDELETEを送信して削除を確定するページ。
*/

import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Recipe } from "../types";

const RecipeDeletePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("レシピの削除に失敗しました。");
      }

      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("未知のエラーが発生しました。");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>読み込み中...</p>;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">レシピ削除</h1>
        <p className="text-sm text-slate-600">以下のレシピを削除しますか？操作は元に戻せません。</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {recipe && (
        <form className="flex flex-col gap-4" onSubmit={handleDelete}>
          <dl className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-slate-500">料理名</dt>
              <dd className="text-sm text-slate-900">{recipe.title}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-slate-500">材料</dt>
              <dd className="whitespace-pre-line text-sm text-slate-900">{recipe.ingredients}</dd>
            </div>
            {recipe.steps && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-slate-500">手順</dt>
                <dd className="whitespace-pre-line text-sm text-slate-900">{recipe.steps}</dd>
              </div>
            )}
            {recipe.notes && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-slate-500">備考</dt>
                <dd className="whitespace-pre-line text-sm text-slate-900">{recipe.notes}</dd>
              </div>
            )}
          </dl>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "削除中..." : "削除"}
            </button>
            <Link to="/" className="text-sm text-slate-600 underline">
              一覧に戻る
            </Link>
          </div>
        </form>
      )}
    </section>
  );
};

export default RecipeDeletePage;
