/*
実行例: npm run dev
概要: Flask APIの`/api/signup`を呼び出して新規ユーザを作成し、そのままログイン画面へ遷移するフォーム。
*/

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid, password }),
      });

      if (response.status === 409) {
        throw new Error("入力されたユーザIDはすでに使用されています。");
      }

      if (!response.ok) {
        throw new Error("ユーザ登録に失敗しました。");
      }

      setInfo("ユーザ登録が完了しました。ログイン画面へ移動します。");
      setTimeout(() => navigate("/login", { replace: true }), 800);
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
        <h1 className="text-2xl font-semibold">ユーザ登録</h1>
        <p className="text-sm text-slate-600">新しいユーザIDとパスワードを設定します。</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {info && <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{info}</p>}
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
            autoComplete="new-password"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>パスワード(確認)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "送信中..." : "登録する"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        すでにアカウントをお持ちの方は <Link to="/login" className="font-medium text-slate-900 underline">ログイン</Link>
      </p>
    </section>
  );
};

export default SignupPage;
