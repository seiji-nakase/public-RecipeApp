/*
実行例: npm run dev
概要: 既存レシピを取得して編集し、`/api/recipes/:id`へPUTするページ。
*/

import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Recipe } from "../types";

const RecipeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [initialRecipe, setInitialRecipe] = useState<Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
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
        setInitialRecipe(data);
        setTitle(data.title);
        setIngredients(data.ingredients);
        setSteps(data.steps);
        setNotes(data.notes);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, ingredients, steps, notes }),
      });

      if (!response.ok) {
        throw new Error("レシピの更新に失敗しました。");
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
        <h1 className="text-2xl font-semibold">レシピ編集</h1>
        <p className="text-sm text-slate-600">料理名・材料・手順・備考を書き換えて更新します。</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {initialRecipe && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            <span>料理名</span>
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>材料</span>
            <textarea
              className="min-h-[120px] rounded border border-slate-300 px-3 py-2"
              value={ingredients}
              onChange={(event) => setIngredients(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>手順</span>
            <textarea
              className="min-h-[120px] rounded border border-slate-300 px-3 py-2"
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>備考</span>
            <textarea
              className="min-h-[80px] rounded border border-slate-300 px-3 py-2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "更新中..." : "編集完了"}
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

export default RecipeEditPage;
