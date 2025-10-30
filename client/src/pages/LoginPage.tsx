/*
実行例: npm run dev
概要: Flask APIの`/api/login`を呼び出してセッションを開始するログインフォーム。
*/

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userid, password }),
      });

      if (!response.ok) {
        throw new Error("ログインに失敗しました。IDとパスワードを確認してください。");
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
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">ログイン</h1>
        <p className="text-sm text-slate-600">登録済みのユーザIDでサインインしてください。</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          <span>ユーザID</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={userid}
            onChange={(event) => setUserid(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>パスワード</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "送信中..." : "ログイン"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        初めての方は <Link to="/signup" className="font-medium text-slate-900 underline">ユーザ登録</Link> へ
      </p>
    </section>
  );
};

export default LoginPage;
