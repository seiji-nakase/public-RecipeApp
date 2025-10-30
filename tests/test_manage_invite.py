"""
実行例: pytest -q
概要: manage_invite CLIユーティリティの主要操作がSQLiteデータベースに反映されることを検証する。
"""

import importlib
import sqlite3
from types import SimpleNamespace
from contextlib import closing


def _reload_manage_invite(monkeypatch, db_path):
    monkeypatch.setenv("DATABASE", str(db_path))
    if "manage_invite" in list(importlib.sys.modules):
        del importlib.sys.modules["manage_invite"]
    return importlib.import_module("manage_invite")


def test_add_invite_and_reactivate(tmp_path, monkeypatch):
    db_path = tmp_path / "manage.db"
    mod = _reload_manage_invite(monkeypatch, db_path)

    mod.add_invite(SimpleNamespace(userid="alice", email="alice@example.com", role="member", reactivate=False))

    with sqlite3.connect(db_path) as conn:
        row = conn.execute("SELECT userid, email, role, is_active, used_at FROM allowed_users WHERE userid = 'alice'").fetchone()
        assert row == ("alice", "alice@example.com", "member", 1, None)

    # Reactivate and update role/email
    mod.add_invite(
        SimpleNamespace(userid="alice", email="alice@new.example.com", role="admin", reactivate=True)
    )

    with sqlite3.connect(db_path) as conn:
        row = conn.execute("SELECT email, role, is_active, used_at FROM allowed_users WHERE userid = 'alice'").fetchone()
        assert row == ("alice@new.example.com", "admin", 1, None)


def test_delete_invite(tmp_path, monkeypatch):
    db_path = tmp_path / "manage.db"
    mod = _reload_manage_invite(monkeypatch, db_path)

    mod.add_invite(SimpleNamespace(userid="carol", email=None, role="member", reactivate=False))
    mod.delete_invite(SimpleNamespace(userid="carol"))

    with sqlite3.connect(db_path) as conn:
        remaining = conn.execute("SELECT COUNT(*) FROM allowed_users WHERE userid = 'carol'").fetchone()[0]
    assert remaining == 0


def test_set_user_role(tmp_path, monkeypatch):
    db_path = tmp_path / "manage.db"
    mod = _reload_manage_invite(monkeypatch, db_path)

    with closing(mod.connect()) as conn:
        conn.execute(
            "INSERT INTO user (userid, password, role) VALUES (?, ?, ?)",
            ("bob", "hashed", "member"),
        )
        conn.commit()

    mod.set_user_role(SimpleNamespace(userid="bob", role="admin"))

    with sqlite3.connect(db_path) as conn:
        role = conn.execute("SELECT role FROM user WHERE userid = 'bob'").fetchone()[0]
        assert role == "admin"
