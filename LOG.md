# プロジェクトログ

このログは、本リポジトリで行った重要な更新や調査を日付順に記録するためのものです。各エントリでは、実施した内容、その背景、影響範囲、必要に応じてメモや次のステップをまとめます。

## 2024-10-23

### codex cli導入
- **内容**: codex cliを導入した。
- **背景**: 開発効率を上げるため。
- **影響範囲**: 
- **Notes**: CUDA 拡張を実行する前に GPU ドライバの互換性を確認すること。

### React + Vite構成案とGitHub Actions導入の進行フロー決定
- **内容**: React + Vite構成案とGitHub Actions導入の進行フローを`codex_idea.txt`にまとめた。
- **背景**: フロントエンド刷新とCI/CD体制整備の全体像を共有し、着手順序を明確化するため。
- **影響範囲**: /codex_idea.txt
- **Notes**: CIワークフロー初期案としてPythonとNodeのテストジョブを想定。Vercel連携の自動デプロイを後続で設計する。

### Flask APIエンドポイントの整備
- **内容**: `/api/recipes`および認証系APIを追加し、JSONレスポンスでCRUDとログイン/ログアウト/サインアップを提供。
- **背景**: Reactフロントから呼び出せるREST APIを用意しつつ、既存テンプレートの動作を維持するため。
- **影響範囲**: app.py
- **Notes**: バリデーション不足時は400/409/401を返し、`_row_to_recipe`ヘルパで整形する構成とした。

### Pytest導入とCI更新
- **内容**: APIのCRUDと認証を検証する`tests/test_api.py`を追加し、`requirements.txt`経由でFlask/pytest依存を明示。CIのPythonジョブは`pip install -r requirements.txt`を実行するよう変更。
- **背景**: React移行前にAPIレイヤーの回帰を検知できる体制を整備するため。
- **影響範囲**: tests/test_api.py, requirements.txt, .github/workflows/ci.yml
- **Notes**: ローカルでの`pytest`実行には事前に依存パッケージをインストールする必要あり。

### Pytestインポート経路の調整
- **内容**: `tests/test_api.py`でルートディレクトリを`sys.path`へ追加し、`import app`が確実に成功するよう修正。
- **背景**: 実行環境によってモジュール解決に失敗するケースが発生したため。
- **影響範囲**: tests/test_api.py
- **Notes**: pytest実行前にプロジェクトルートからコマンドを実行する前提は変わらない。

### Pytestのローカル実行確認
- **内容**: 仮想環境上で`pip install -r requirements.txt`実行後、`pytest -q`で全テストが成功することを確認。
- **背景**: CIと同等のテストがローカル開発でも再現できることを検証するため。
- **影響範囲**: tests/test_api.py, requirements.txt
- **Notes**: 現状2件のテストが通過。今後APIを拡張した際はテストを追加予定。

### Reactクライアント環境の初期化
- **内容**: `client/`配下にVite + React + Tailwind構成を作成し、`npm run dev/build/test`のスクリプトとVitest用の雛形テストを追加。APIプロキシ設定やJest DOMの初期化も整備。
- **背景**: フロントエンドをReactへ段階的に移行するための初期土台を準備するため。
- **影響範囲**: clientディレクトリ一式, .github/workflows/ci.yml
- **Notes**: 依存パッケージのインストール後に`npm run test`でVitestが実行できる想定。Tailwind設定済み。

### Reactビルド環境の型定義調整
- **内容**: `@types/node`を追加し、`tsconfig`と`vite.config.ts`を調整することで`npm run build`時の型エラーを解消。テストでは`globalThis`に対して`fetch`をモックするよう修正。
- **背景**: TypeScriptがNode型を解決できず、Viteビルドが失敗していたため。
- **影響範囲**: client/package.json, client/tsconfig*.json, client/vite.config.ts, client/src/__tests__/App.test.tsx
- **Notes**: 変更後は`npm install`再実行のうえで`npm run build`が成功する想定。

### ViteビルドのWorker型エラー解消
- **内容**: TypeScript用に`client/src/global.d.ts`を追加し、ブラウザの`Worker`を簡易定義。併せて`tsconfig`のlib設定を整理し衝突を避けた。
- **背景**: Viteの型定義が`Worker`を参照するため、型解決ができず`npm run build`が失敗していた。
- **影響範囲**: client/src/global.d.ts, client/tsconfig.json, client/tsconfig.node.json, client/package.json
- **Notes**: `npm run build`は`tsc --noEmit`で型検査後に`vite build`を実行。依存更新後に通ることを確認する。

### FlaskによるReactビルド配信
- **内容**: Flask経由で`client/dist`の静的ファイルを返すよう`/`ルートと`/assets/*`ルートを整備し、存在しないパスはSPA用に`index.html`へフォールバック。faviconにも対応。
- **背景**: React側の画面をFlaskのURLひとつで提供したいという要望に応えるため。
- **影響範囲**: app.py
- **Notes**: Reactビルドが未生成の場合は旧来のテンプレートを表示し、ビルド後はReactが優先表示される。

### React未認証時のハンドリング強化
- **内容**: `/api/recipes`がHTML（ログイン画面）を返すケースで`App`コンポーネントが「ログインが必要」と案内するよう例外処理を変更し、Vitestでカバー。
- **背景**: Flask配信時に未ログインだとエラー文がわかりにくかったため。
- **影響範囲**: client/src/App.tsx, client/src/__tests__/App.unauth.test.tsx
- **Notes**: `npm run test`で新規テストを含め成功することを確認。

### Reactログイン/サインアップページの初期実装
- **内容**: React Routerを導入し、`HomePage`/`LoginPage`/`SignupPage`を作成。共通レイアウトとナビゲーションを整備し、VitestをHomePage向けに更新。
- **背景**: 既存Flaskテンプレートの機能をSPAへ段階的に移行するため。
- **影響範囲**: client/package.json, client/src/App.tsx, client/src/pages/*.tsx, client/src/__tests__/*.tsx, .gitignore
- **Notes**: React Router経由で主要画面へ遷移可能になった。今後はCRUDフォームのReact移行を進める。


## 2025-10-24

### VS Codeワークスペース自動ターミナル設定
- **内容**: ワークスペースを開いた際に4つの統合ターミナル（codex/server/client/git）が自動起動し、仮想環境を有効化した状態で利用できるよう`tasks`を追加。
- **背景**: VS Code起動直後から各作業用ターミナルを整備しておき、毎回の手動起動や`venv`有効化の手間を省くため。
- **影響範囲**: flask_memo.code-workspace
- **Notes**: 初回起動時は自動タスク実行の許可ダイアログが出た場合に「許可」を選択する必要がある。

### 仮想環境自動有効化スクリプト整備
- **内容**: VS Code自動ターミナルが`venv`を確実に読み込むよう、専用RCスクリプトとタスク定義を更新。
- **背景**: codex/server/client/git各ターミナルで`conda base`が優先され、仮想環境が無効化されていたため。
- **影響範囲**: flask_memo.code-workspace, .vscode/activate_flask_memo.sh
- **Notes**: VS Code再読み込み後に自動起動を確認し、不要なスピナーが出ないことを検証する。

### VS Codeターミナルプロファイル移行
- **内容**: 自動タスクでのターミナル起動を廃止し、代わりに統合ターミナルプロファイルを4種類（codex/server/client/git）定義。プロファイルは`venv`を有効化した状態で所定のディレクトリを開く。
- **背景**: 自動タスク方式ではタスクが完了扱いにならずステータスバーにスピナーが残ってしまったため。
- **影響範囲**: flask_memo.code-workspace, .vscode/settings.json, .vscode/activate_flask_memo.sh
- **Notes**: ターミナルを一度開けば永続セッション機能により再起動後も状態が復元される。必要に応じて`Terminal: 新しいターミナル (プロファイル)`から各プロファイルを選択する。`client`プロファイルは起動直後に`cd flask_memo/client`を実行してからシェルを引き継ぐため、`.bashrc`の設定有無に関わらずサブディレクトリで開く。

### VS Codeワークスペース設定ドキュメント追加
- **内容**: ワークスペースファイルの役割とターミナルプロファイルの動作を整理した`workspace_setting.txt`を作成。
- **背景**: ワークスペース起動時にどのファイルがどのように働いているのかを共有しやすくするため。
- **影響範囲**: workspace_setting.txt
- **Notes**: 運用メモとして日本語で手順をまとめ、ターミナルプロファイル選択時の挙動とRCスクリプトの連携を明記した。


## 2025-10-25

### ReactでのレシピCRUDフォーム移植
- **内容**: レシピ一覧に登録・編集・削除リンクを追加し、新規作成/編集/削除ページを追加。APIに対してPOST/PUT/DELETEを行い、テストはMemoryRouter経由でHomePageをラップする形に調整。
- **背景**: Flaskテンプレートの機能をReactへ段階的に移行するため。
- **影響範囲**: client/src/pages/HomePage.tsx, RecipeCreatePage.tsx, RecipeEditPage.tsx, RecipeDeletePage.tsx, client/src/App.tsx, client/src/__tests__/*.tsx, client/src/types.ts
- **Notes**: `npm run test`および`npm run build`の成功を確認済み。操作にはログイン済みセッションが必要。開発者によるユーザテスト済み。

### Flaskテンプレート撤去とSPA配信の一本化
- **内容**: FlaskのHTMLテンプレートとフォームルートを撤廃し、`/`, `/login`, `/signup` などの画面はReactビルドを返す構成に統一。API未認証時は401 JSONを返すようにした。
- **背景**: 画面レンダリングを全面的にReactへ移行し、FlaskをAPI + 静的配信役に限定するため。
- **影響範囲**: app.py, templates/ (削除), AGENTS.md
- **Notes**: Reactビルドが存在しない場合は503で案内。`pytest -q`, `npm run test`, `npm run build` が成功することを手動確認済み。

### 管理スクリプトとテストの追加
- **内容**: `manage_invite.py`を作成し、招待追加/再有効化/一覧/ロール変更をCLIで操作できるようにした。`tests/test_manage_invite.py`で主要コマンドを検証。
- **背景**: Render等にデプロイしたサーバ上で安全に招待制ユーザ管理を行うため。
- **影響範囲**: manage_invite.py, AGENTS.md, tests/test_manage_invite.py
- **Notes**: `python manage_invite.py --help` で操作方法を確認可能。`DATABASE`環境変数でSQLiteパスを切り替えられる。

### JST基準のタイムスタンプ整備
- **内容**: `allowed_users.invited_at`/`used_at` を JST (UTC+9) で記録するように統一し、CLIからの招待追加・再招待・削除もこのルールに従うよう変更。ガイドラインではプロジェクト全体でJSTを使用する旨を明記。
- **背景**: アプリ全体で日本標準時を基準とした運用に揃えるため。
- **影響範囲**: app.py, manage_invite.py, AGENTS.md, tests/test_manage_invite.py
- **Notes**: `manage_invite.py delete --userid ...` で招待の完全削除が可能になった。

### DBスキーマ整備の自動化
- **内容**: `ensure_schema` に `recipe` テーブルの作成処理を追加し、新規/再生成されたDBでも`/api/recipes`がエラーなく動作するように調整。
- **背景**: SQLite初期化時に`recipe`テーブルが欠落していると500エラーになるため。
- **影響範囲**: app.py
- **Notes**: アプリ起動時やテスト時に自動でテーブルが揃う。

### レシピ項目の拡張とUI更新
- **内容**: レシピに `ingredients` / `steps` / `notes` を追加し、API・Reactフォーム・テストを改修。旧 `body` 列の値はマイグレーションで `ingredients` に統合し、列自体を排除。一覧はタイトルのみを表示し、詳細ページで項目を閲覧する方式に変更。
- **背景**: 材料・手順・備考を個別に管理し、画面表示と編集体験を改善するため。
- **影響範囲**: app.py, tests/test_api.py, client/src/pages/*, client/src/types.ts, client/src/__tests__/*.tsx, AGENTS.md
- **Notes**: `ensure_schema` 実行で不足列の追加と旧スキーマからの移行が自動実行される。


## 2025-10-27

### セッション関連のセキュリティ強化
- **内容**: `SECRET_KEY` を環境変数優先に変更し、セッションCookieをHTTPOnly + SameSite=Lax（本番ではSecure）で配信するように設定。
- **背景**: デプロイ環境でのシークレット管理とCookie保護を強化するため。
- **影響範囲**: app.py, AGENTS.md
- **Notes**: Renderなど本番環境では環境変数 `SECRET_KEY` を必ず設定する。

### PythonAnywhereホスティング方針決定
- **内容**: Render/Neon案を撤回し、PythonAnywhere無料枠で常時稼働させつつ `client/dist` を静的配信する運用に切り替える方針を整理。手動/CI双方でのデプロイ手順を `codex_idea.txt` に再記述した。
- **背景**: Render 無料枠のスリープ問題と Shell 制約が運用要件と合わなかったため。PythonAnywhere なら招待管理がコンソールで実行でき、SQLite も永続化される。
- **影響範囲**: codex_idea.txt, AGENTS.md
- **Notes**: GitHub Actions から PythonAnywhere Files API を利用したアップロードと reload を行う `deploy` ジョブを後続で実装する。

### PythonAnywhere向けCI/CDの完成と動作確認
- **内容**: GitHub Actions の `deploy` ジョブを Files API でのアップロードと Web API の reload に対応させ、自動で PythonAnywhere を更新できるようにした。`PA_WORKDIR` を正しく絶対パスのまま扱うよう修正し、409エラーの原因だった `/` 直下への誤アップロードを解消。既存ファイル更新時の HTTP 200 も成功として扱う。
- **背景**: `main` ブランチへのマージだけで本番が最新化される体制を整え、手動コピーを不要にするため。
- **影響範囲**: .github/workflows/ci.yml
- **Notes**: Secrets (`PA_USERNAME`, `PA_API_TOKEN`, `PA_WEBAPP`, `PA_WORKDIR`) を設定し、`main` 更新でデプロイが走ることを確認。デプロイ後に画面表示・ログイン・レシピCRUDを手動確認済み。`recipe_memo.db` はホーム直下で永続化されるため招待/レシピデータは保持される。

## 2025-10-28

### スマホ画面で上のリンクバーが２行になるのを回避
- **内容**: 画面左上にあった「レシピアプリ」を削除
- **背景**: スマホで開くと、画面が狭いから真ん中の余白がなくなり、レシピアプリとかレシピ一覧とかログインとかのテキストはすべて２行になってしまう。これが１行になるようにするため。
- **影響範囲**: src/App.tsx
- **Notes**: ユーザ登録画面も一度登録したら使わないので、廃止するのも良いかも。