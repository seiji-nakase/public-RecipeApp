"""
実行例: pytest -q
概要: FlaskアプリのAPIエンドポイントが認証付きでCRUD動作することを検証する。
"""

import sqlite3
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pytest

import app as flask_app


SCHEMA_SQL = """
CREATE TABLE user (
    unum integer primary key autoincrement,
    userid text not null unique,
    password text not null,
    role text not null default 'member'
);
CREATE TABLE recipe (
    id integer primary key autoincrement,
    title text not null,
    ingredients text,
    steps text,
    notes text
);
CREATE TABLE allowed_users (
    id integer primary key autoincrement,
    userid text not null unique,
    email text,
    role text not null default 'member',
    invited_at text not null default CURRENT_TIMESTAMP,
    used_at text,
    is_active integer not null default 1
);
"""


@pytest.fixture
def client(tmp_path):
    db_path = tmp_path / "test.db"
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA_SQL)
    conn.close()

    flask_app.app.config.update(
        TESTING=True,
        DATABASE=str(db_path),
    )

    with flask_app.app.test_client() as test_client:
        yield test_client


def _allow_user(userid: str, role: str = "member") -> None:
    db_path = flask_app.app.config["DATABASE"]
    conn = sqlite3.connect(db_path)
    conn.execute(
        "insert into allowed_users (userid, role) values (?, ?)",
        (userid, role),
    )
    conn.commit()
    conn.close()


def _signup_and_login(client):
    _allow_user("tester")
    signup_resp = client.post(
        "/api/signup",
        json={"userid": "tester", "password": "secret"},
    )
    assert signup_resp.status_code == 201

    login_resp = client.post(
        "/api/login",
        json={"userid": "tester", "password": "secret"},
    )
    assert login_resp.status_code == 200


def test_recipes_flow_requires_auth(client):
    response = client.get("/api/recipes")
    # 未ログイン時は401(JSON)を返す。古いブラウザからのアクセス互換のため302も許容。
    assert response.status_code in (302, 401)


def test_signup_requires_invite(client):
    response = client.post(
        "/api/signup",
        json={"userid": "unauthorized", "password": "secret"},
    )
    assert response.status_code == 403


def test_recipes_crud_flow(client):
    _signup_and_login(client)

    create_resp = client.post(
        "/api/recipes",
        json={
            "title": "パンケーキ",
            "ingredients": "薄力粉 / 卵",
            "steps": "材料を混ぜて焼く",
            "notes": "メープルシロップを添える",
        },
    )
    assert create_resp.status_code == 201
    recipe_id = create_resp.get_json()["id"]

    list_resp = client.get("/api/recipes")
    assert list_resp.status_code == 200
    recipes = list_resp.get_json()
    assert len(recipes) == 1
    assert recipes[0]["title"] == "パンケーキ"
    assert recipes[0]["ingredients"] == "薄力粉 / 卵"
    assert recipes[0]["steps"] == "材料を混ぜて焼く"
    assert recipes[0]["notes"] == "メープルシロップを添える"

    update_resp = client.put(
        f"/api/recipes/{recipe_id}",
        json={
            "title": "抹茶パンケーキ",
            "ingredients": "薄力粉 / 卵 / 抹茶パウダー",
            "steps": "抹茶を加えて焼く",
            "notes": "仕上げに粉砂糖",
        },
    )
    assert update_resp.status_code == 200
    updated_payload = update_resp.get_json()
    assert updated_payload["title"] == "抹茶パンケーキ"
    assert updated_payload["ingredients"] == "薄力粉 / 卵 / 抹茶パウダー"
    assert updated_payload["steps"] == "抹茶を加えて焼く"
    assert updated_payload["notes"] == "仕上げに粉砂糖"

    delete_resp = client.delete(f"/api/recipes/{recipe_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.get_json()["status"] == "deleted"

    list_after_delete = client.get("/api/recipes")
    assert list_after_delete.status_code == 200
    assert list_after_delete.get_json() == []
