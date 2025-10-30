/*
実行例: npm run dev
概要: レシピ一覧をAPIから取得して表示し、未認証時のメッセージも案内するトップページ。
*/

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Recipe } from "../types";

const HomePage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/api/recipes", {
          credentials: "include",
        });

        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          if (response.status === 401 || response.redirected) {
            throw new Error("unauthorized");
          }
          throw new Error(`API error: ${response.status}`);
        }

        if (contentType && contentType.includes("application/json")) {
          const data: Recipe[] = await response.json();
          setRecipes(data);
        } else {
          throw new Error("unauthorized");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  return (
    <section className="flex flex-col gap-6">
      {loading && <p data-testid="loading">読み込み中...</p>}
      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700" data-testid="error">
          {error === "unauthorized"
            ? "ログインが必要です。画面右上のログインリンクから認証してください。"
            : `データ取得に失敗しました: ${error}`}
        </p>
      )}
      {!loading && !error && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">レシピ一覧</h2>
          <div>
            <Link
              to="/recipes/new"
              className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              レシピを登録
            </Link>
          </div>
          {recipes.length === 0 ? (
            <p data-testid="empty">まだレシピがありません。</p>
          ) : (
            <ul className="space-y-3">
              {recipes.map((recipe) => (
                <li key={recipe.id} className="rounded border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="text-base font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {recipe.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link
                        to={`/recipes/${recipe.id}/edit`}
                        className="rounded border border-slate-200 px-3 py-1 text-slate-700 hover:border-slate-300 hover:text-slate-900"
                      >
                        編集
                      </Link>
                      <Link
                        to={`/recipes/${recipe.id}/delete`}
                        className="rounded border border-red-200 px-3 py-1 text-red-600 hover:border-red-300 hover:text-red-700"
                      >
                        削除
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
};

export default HomePage;
