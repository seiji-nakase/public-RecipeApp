from flask import (
    Flask,
    g,
    redirect,
    request,
    jsonify,
    abort,
    current_app,
    send_from_directory,
)
import sqlite3
from flask_login import (
    UserMixin,
    LoginManager,
    login_required,
    login_user,
    logout_user,
)
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta

DATABASE = "recipe_memo.db"
CLIENT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "client", "dist")

JST = timezone(timedelta(hours=9))


def now_jst() -> str:
    return datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(32)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

if os.environ.get("FLASK_ENV") == "production":
    app.config.update(SESSION_COOKIE_SECURE=True)
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin):
    def __init__(self, userid):
        self.id = userid
        
### ログイン
@login_manager.user_loader
def load_user(userid):
    return User(userid)

@login_manager.unauthorized_handler
def unauthorized():
    if request.path.startswith('/api/'):
        return jsonify({"message": "authentication required"}), 401
    return redirect('/login')

@app.route("/logout", methods = ['GET'])
def logout():
    logout_user()
    return redirect('/login')

def _serve_react_index():
    build_index = os.path.join(CLIENT_BUILD_DIR, "index.html")
    if os.path.exists(build_index):
        return send_from_directory(CLIENT_BUILD_DIR, "index.html")
    return (
        "React build not found. Run `npm run build` in the client directory.",
        503,
    )


@app.route("/")
def top():
    return _serve_react_index()


@app.route("/login", methods=["GET"])
def login_page():
    return _serve_react_index()


@app.route("/signup", methods=["GET"])
def signup_page():
    return _serve_react_index()


@app.route("/assets/<path:filename>")
def client_assets(filename):
    assets_dir = os.path.join(CLIENT_BUILD_DIR, "assets")
    file_path = os.path.join(assets_dir, filename)
    if os.path.exists(file_path):
        return send_from_directory(assets_dir, filename)
    abort(404)


@app.route("/favicon.ico")
def favicon():
    favicon_path = os.path.join(CLIENT_BUILD_DIR, "favicon.ico")
    if os.path.exists(favicon_path):
        return send_from_directory(CLIENT_BUILD_DIR, "favicon.ico")
    abort(404)


def _row_to_recipe(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "ingredients": row["ingredients"],
        "steps": row["steps"],
        "notes": row["notes"],
    }


@app.route("/api/recipes", methods=["GET"])
@login_required
def api_list_recipes():
    recipes = get_db().execute(
        "select id, title, ingredients, steps, notes from recipe"
    ).fetchall()
    return jsonify([_row_to_recipe(row) for row in recipes])


@app.route("/api/recipes", methods=["POST"])
@login_required
def api_create_recipe():
    payload = request.get_json(silent=True) or {}

    def _get_str(field: str, required: bool = False) -> str:
        value = payload.get(field)
        if value is None:
            if required:
                abort(400, description=f"{field} is required")
            return ""
        if not isinstance(value, str):
            abort(400, description=f"{field} must be a string")
        return value.strip()

    title = _get_str("title", required=True)
    ingredients = _get_str("ingredients")
    steps = _get_str("steps")
    notes = _get_str("notes")
    db = get_db()
    cursor = db.execute(
        "insert into recipe (title, ingredients, steps, notes) values(?, ?, ?, ?)",
        [title, ingredients, steps, notes]
    )
    db.commit()
    new_id = cursor.lastrowid
    recipe = db.execute(
        "select id, title, ingredients, steps, notes from recipe where id = ?",
        [new_id]
    ).fetchone()
    return jsonify(_row_to_recipe(recipe)), 201

def _fetch_recipe_or_404(recipe_id):
    row = get_db().execute(
        "select id, title, ingredients, steps, notes from recipe where id = ?",
        (recipe_id, )
    ).fetchone()
    if row is None:
        abort(404, description="recipe not found")
    return row


@app.route("/api/recipes/<int:recipe_id>", methods=["GET"])
@login_required
def api_get_recipe(recipe_id):
    record = _fetch_recipe_or_404(recipe_id)
    return jsonify(_row_to_recipe(record))


@app.route("/api/recipes/<int:recipe_id>", methods=["PUT"])
@login_required
def api_update_recipe(recipe_id):
    payload = request.get_json(silent=True) or {}

    def _get_str(field: str, required: bool = False) -> str:
        value = payload.get(field)
        if value is None:
            if required:
                abort(400, description=f"{field} is required")
            return ""
        if not isinstance(value, str):
            abort(400, description=f"{field} must be a string")
        return value.strip()

    title = _get_str("title", required=True)
    ingredients = _get_str("ingredients")
    steps = _get_str("steps")
    notes = _get_str("notes")
    _fetch_recipe_or_404(recipe_id)
    db = get_db()
    db.execute(
        "update recipe set title = ?, ingredients = ?, steps = ?, notes = ? where id = ?",
        [title, ingredients, steps, notes, recipe_id]
    )
    db.commit()
    updated = _fetch_recipe_or_404(recipe_id)
    return jsonify(_row_to_recipe(updated))


@app.route("/api/recipes/<int:recipe_id>", methods=["DELETE"])
@login_required
def api_delete_recipe(recipe_id):
    _fetch_recipe_or_404(recipe_id)
    db = get_db()
    db.execute("delete from recipe where id = ?", (recipe_id, ))
    db.commit()
    return jsonify({"status": "deleted", "id": recipe_id})


@app.route("/api/login", methods=["POST"])
def api_login():
    payload = request.get_json(silent=True) or {}
    userid = payload.get("userid", "")
    password = payload.get("password", "")
    if not userid or not password:
        abort(400, description="userid and password are required")
    user_data = get_db().execute(
        "select password from user where userid = ?", [userid, ]
    ).fetchone()
    if user_data is not None and check_password_hash(user_data[0], password):
        login_user(User(userid))
        return jsonify({"status": "ok", "userid": userid})
    abort(401, description="invalid credentials")


@app.route("/api/logout", methods=["POST"])
@login_required
def api_logout():
    logout_user()
    return jsonify({"status": "ok"})


@app.route("/api/signup", methods=["POST"])
def api_signup():
    payload = request.get_json(silent=True) or {}
    userid = payload.get("userid", "")
    password = payload.get("password", "")
    if not userid or not password:
        abort(400, description="userid and password are required")

    pass_hash = generate_password_hash(password, method='pbkdf2:sha256')
    db = get_db()
    user_check = db.execute(
        "select userid from user where userid = ?", [userid, ]
    ).fetchone()
    if user_check:
        abort(409, description="userid already exists")

    invite = db.execute(
        """
        select role, is_active, used_at from allowed_users
        where userid = ?
        """,
        [userid],
    ).fetchone()
    if invite is None or invite["is_active"] == 0:
        abort(403, description="signup not allowed")
    if invite["used_at"] is not None:
        abort(409, description="invitation already used")

    role = invite["role"] if invite["role"] else "member"
    db.execute(
        "insert into user (userid, password, role) values(?, ?, ?)",
        [userid, pass_hash, role]
    )
    db.execute(
        "update allowed_users set used_at = ? where userid = ?",
        [now_jst(), userid],
    )
    db.commit()
    return jsonify({"status": "ok", "userid": userid, "role": role}), 201


@app.errorhandler(404)
def spa_fallback(error):
    request_path = request.path
    if request_path.startswith("/api"):
        return error

    return _serve_react_index()


if __name__ == "__main__":
    app.run()
    
# database
def connect_db():
    db_path = current_app.config.get("DATABASE", DATABASE) # 使用するDBを切り替え可能に
    rv = sqlite3.connect(db_path)
    rv.row_factory = sqlite3.Row
    ensure_schema(rv)
    return rv

def get_db():
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db


@app.teardown_appcontext
def close_db(error=None):
    sqlite_db = getattr(g, "sqlite_db", None)
    if sqlite_db is not None:
        sqlite_db.close()


def ensure_schema(conn):
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

    user_columns = [row["name"] for row in conn.execute("PRAGMA table_info('user')")]  # type: ignore[index]
    if "role" not in user_columns:
        conn.execute("ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'member'")

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

    conn.execute(
        """
CREATE TABLE IF NOT EXISTS recipe (
    id integer primary key autoincrement,
    title text not null,
    ingredients text,
    steps text,
    notes text
)
        """
    )

    recipe_columns = {row["name"] for row in conn.execute("PRAGMA table_info('recipe')")}  # type: ignore[index]
    required_columns = {"id", "title", "ingredients", "steps", "notes"}
    needs_migration = False
    if not required_columns.issubset(recipe_columns):
        needs_migration = True
    if "body" in recipe_columns:
        needs_migration = True

    if needs_migration:
        conn.execute(
            """
CREATE TABLE IF NOT EXISTS recipe__new (
    id integer primary key autoincrement,
    title text not null,
    ingredients text,
    steps text,
    notes text
)
            """
        )

        colset = recipe_columns

        def has(column: str) -> bool:
            return column in colset

        if has("ingredients") and has("body"):
            ingredients_expr = "COALESCE(NULLIF(ingredients,''), NULLIF(body,''), '')"
        elif has("ingredients"):
            ingredients_expr = "COALESCE(NULLIF(ingredients,''), '')"
        elif has("body"):
            ingredients_expr = "COALESCE(NULLIF(body,''), '')"
        else:
            ingredients_expr = "''"

        steps_expr = "steps" if has("steps") else "''"
        notes_expr = "notes" if has("notes") else "''"

        select_query = f"""
            INSERT INTO recipe__new (id, title, ingredients, steps, notes)
            SELECT id,
                   title,
                   {ingredients_expr} AS ingredients,
                   {steps_expr} AS steps,
                   {notes_expr} AS notes
            FROM recipe
        """
        conn.execute(select_query)
        conn.execute("DROP TABLE recipe")
        conn.execute("ALTER TABLE recipe__new RENAME TO recipe")

    conn.commit()
