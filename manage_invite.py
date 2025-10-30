"""
実行例: python manage_invite.py add --userid alice --email alice@example.com --role member
概要: allowed_usersテーブルの招待情報やuserテーブルのロールを管理するコマンドラインツール。


運用時確認フロー（招待制 + React/Flask統合）

1. 前提準備
   - バックエンド環境変数: `FLASK_APP=app.py`, `FLASK_ENV=development`（必要に応じて設定）。
   - `venv`を有効化済み。
   - Reactビルド済み (`npm run build`) または `npm run dev` を別ターミナルで起動。

2. 招待ユーザ投入
   - 例: `python manage_invite.py add --userid alice --email alice@example.com --role member`
   - 管理者用招待: `python manage_invite.py add --userid admin --email admin@example.com --role admin`
   - `python manage_invite.py list-invites` で状態確認。
   - （ python manage_invite.py delete --userid alice で削除 ）

3. サーバ起動
   - Flask: `flask run`
   - （開発時は別ターミナルで）React: `npm run dev`
   - ブラウザで `http://127.0.0.1:5000/` または `5173` にアクセス。

4. ユーザ登録（サインアップ）
   - 画面右上「ユーザ登録」→ 招待済み `userid` と任意のパスワードを入力。
   - 成功後に `allowed_users.used_at` が埋まり、`user` テーブルへ書き込みされる。
   - `python manage_invite.py list-users` で登録結果を確認。

5. ログイン / ログアウト確認
   - `ログイン`画面でサインアップした `userid` とパスワードを入力。
   - 成功後、ホームに自動リダイレクト。ナビゲーションにログアウトボタンがある場合は動作も確認。
   - `python manage_invite.py set-user-role --userid alice --role admin` でロール変更後、再ログインして変化を検証（将来の管理UI開発時のベース動作）。

6. レシピ CRUD
   - 「レシピを登録」→ 料理名/材料を入力 → 保存。
   - 保存後、一覧に反映されることを確認。
   - 各レシピの「編集」「削除」を実行し、更新内容・削除後の状態が正しいか確認。
   - ブラウザ開発者ツールで `/api/recipes` へのリクエスト/レスポンスを追跡。

7. エラー系ハンドリング
   - 未ログイン状態で `/api/recipes` を叩くと 401 JSON を返すこと。
   - 招待なしでサインアップすると 403 が返ること。
   - 既使用の招待で再度サインアップした場合 409 が返ること。

8. 管理スクリプト
   - `python manage_invite.py reactivate --userid alice` で招待を一覧から再活性化 → もう一度登録できないか（409）を確認。
   - `python manage_invite.py deactivate --userid admin` → その `userid` でサインアップしようとすると 403 になることを確認。
   - `python manage_invite.py list-invites` / `list-users` で最終状態を取得し、ログとして保存。

9. 後片付け
   - 開発用DBを初期化したい場合は `rm flask_memo.db` などで削除（招待やユーザ登録がリセットされる）。
   - Render等にデプロイする際はサーバ上で同じスクリプトを実行して招待を投入。

備考
- React Router v7 のFuture Warningは現時点では無視可能だが、将来のバージョンアップで`RouterProvider`の`future`設定を調整する。
- 招待登録後に CLI で`set-user-role`を使うと即座にロールが反映されるので、管理者用機能のテストも容易。
"""

import argparse
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone, timedelta
from typing import Any, Iterable

DATABASE_PATH = os.environ.get("DATABASE", "recipe_memo.db")
JST = timezone(timedelta(hours=9))


def now_jst() -> str:
    return datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        from app import ensure_schema  # type: ignore
    except ImportError:
        ensure_schema = _ensure_schema_fallback  # type: ignore
    ensure_schema(conn)
    return conn


def _ensure_schema_fallback(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user (
            unum integer primary key autoincrement,
            userid text not null unique,
            password text not null,
            role text not null default 'member'
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS allowed_users (
            id integer primary key autoincrement,
            userid text not null unique,
            email text,
            role text not null default 'member',
            invited_at text not null default (datetime('now','+9 hours')),
            used_at text,
            is_active integer not null default 1
        )
        """
    )
    conn.commit()


def add_invite(args: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        cursor = conn.execute(
            "SELECT id, is_active, used_at FROM allowed_users WHERE userid = ?",
            (args.userid,),
        )
        row = cursor.fetchone()
        if row:
            if not args.reactivate:
                raise SystemExit(
                    f"[ERROR] userid '{args.userid}' は既に招待済みです。"
                    " --reactivate を指定して再招待してください。"
                )
            conn.execute(
                """
                UPDATE allowed_users
                SET email = ?, role = ?, is_active = 1, used_at = NULL, invited_at = ?
                WHERE userid = ?
                """,
                (args.email, args.role, now_jst(), args.userid),
            )
            action = "再招待"
        else:
            conn.execute(
                """
                INSERT INTO allowed_users (userid, email, role, is_active, invited_at)
                VALUES (?, ?, ?, 1, ?)
                """,
                (args.userid, args.email, args.role, now_jst()),
            )
            action = "招待登録"
        conn.commit()
        print(f"[OK] {args.userid} を{action}しました。")


def deactivate_invite(args: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        updated = conn.execute(
            "UPDATE allowed_users SET is_active = 0 WHERE userid = ?",
            (args.userid,),
        ).rowcount
        conn.commit()
        if updated:
            print(f"[OK] {args.userid} の招待を無効化しました。")
        else:
            print(f"[WARN] {args.userid} の招待が見つかりません。")


def reactivate_invite(args: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        updated = conn.execute(
            """
            UPDATE allowed_users
            SET is_active = 1,
                used_at = NULL,
                invited_at = ?
            WHERE userid = ?
            """,
            (now_jst(), args.userid),
        ).rowcount
        conn.commit()
        if updated:
            print(f"[OK] {args.userid} の招待を再有効化しました。")
        else:
            print(f"[WARN] {args.userid} の招待が見つかりません。")


def delete_invite(args: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        deleted = conn.execute(
            "DELETE FROM allowed_users WHERE userid = ?",
            (args.userid,),
        ).rowcount
        conn.commit()
        if deleted:
            print(f"[OK] {args.userid} の招待を削除しました。")
        else:
            print(f"[WARN] {args.userid} の招待が見つかりません。")


def list_invites(_: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        rows = conn.execute(
            """
            SELECT userid, email, role, is_active, used_at, invited_at
            FROM allowed_users
            ORDER BY invited_at DESC
            """
        ).fetchall()
    _print_table(
        rows,
        headers=["userid", "email", "role", "is_active", "used_at", "invited_at"],
        empty_message="[INFO] 招待が登録されていません。",
    )


def list_users(_: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        rows = conn.execute(
            """
            SELECT userid, role
            FROM user
            ORDER BY userid
            """
        ).fetchall()
    _print_table(
        rows,
        headers=["userid", "role"],
        empty_message="[INFO] 登録済みユーザが存在しません。",
    )


def set_user_role(args: argparse.Namespace) -> None:
    with closing(connect()) as conn:
        updated = conn.execute(
            "UPDATE user SET role = ? WHERE userid = ?",
            (args.role, args.userid),
        ).rowcount
        conn.commit()
        if updated:
            print(f"[OK] {args.userid} のロールを {args.role} に更新しました。")
        else:
            print(f"[WARN] {args.userid} は未登録です。")


def _print_table(rows: Iterable[sqlite3.Row], headers: list[str], empty_message: str) -> None:
    rows = list(rows)
    if not rows:
        print(empty_message)
        return

    widths = [len(header) for header in headers]
    for row in rows:
        for idx, header in enumerate(headers):
            widths[idx] = max(widths[idx], len(str(row[header])))

    def fmt(values: Iterable[Any]) -> str:
        return " | ".join(str(value).ljust(widths[idx]) for idx, value in enumerate(values))

    print(fmt(headers))
    print("-+-".join("-" * width for width in widths))
    for row in rows:
        print(fmt(row[h] for h in headers))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="allowed_users / user テーブルを管理するためのCLIツール。",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="招待ユーザを追加する")
    add_parser.add_argument("--userid", required=True)
    add_parser.add_argument("--email", default=None)
    add_parser.add_argument("--role", default="member")
    add_parser.add_argument(
        "--reactivate",
        action="store_true",
        help="既存招待を再有効化して上書きする",
    )
    add_parser.set_defaults(func=add_invite)

    deactivate_parser = subparsers.add_parser("deactivate", help="招待を無効化する")
    deactivate_parser.add_argument("--userid", required=True)
    deactivate_parser.set_defaults(func=deactivate_invite)

    reactivate_parser = subparsers.add_parser("reactivate", help="招待を再有効化する")
    reactivate_parser.add_argument("--userid", required=True)
    reactivate_parser.set_defaults(func=reactivate_invite)

    delete_parser = subparsers.add_parser("delete", help="招待を完全に削除する")
    delete_parser.add_argument("--userid", required=True)
    delete_parser.set_defaults(func=delete_invite)

    list_inv_parser = subparsers.add_parser("list-invites", help="招待一覧を表示する")
    list_inv_parser.set_defaults(func=list_invites)

    list_user_parser = subparsers.add_parser("list-users", help="登録済みユーザ一覧を表示する")
    list_user_parser.set_defaults(func=list_users)

    promote_parser = subparsers.add_parser("set-user-role", help="登録済みユーザのロールを変更する")
    promote_parser.add_argument("--userid", required=True)
    promote_parser.add_argument("--role", required=True)
    promote_parser.set_defaults(func=set_user_role)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
