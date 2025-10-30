/*
実行例: npm run dev
概要: 新規レシピを作成するフォームを表示し、`/api/recipes`へPOSTするページ。
*/

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const RecipeCreatePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, ingredients, steps, notes }),
      });

      if (response.status === 401) {
        throw new Error("ログインしてから操作してください。");
      }

      if (!response.ok) {
        throw new Error("レシピの登録に失敗しました。");
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

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">レシピ登録</h1>
        <p className="text-sm text-slate-600">料理名・材料・手順・備考を入力して新しいレシピを作成します。</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
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
            {submitting ? "登録中..." : "レシピ登録"}
          </button>
          <Link to="/" className="text-sm text-slate-600 underline">
            一覧に戻る
          </Link>
        </div>
      </form>
    </section>
  );
};

export default RecipeCreatePage;
