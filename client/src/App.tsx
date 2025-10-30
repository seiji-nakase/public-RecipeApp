/*
実行例: npm run dev
概要: React Routerでログイン・登録・トップページを切り替えるアプリ全体のルート定義。
*/

import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RecipeCreatePage from "./pages/RecipeCreatePage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import RecipeEditPage from "./pages/RecipeEditPage";
import RecipeDeletePage from "./pages/RecipeDeletePage";

const AppLayout = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="text-slate-700 hover:text-slate-900">
            レシピ一覧
          </Link>
          <Link to="/login" className="text-slate-700 hover:text-slate-900">
            ログイン
          </Link>
          <Link to="/signup" className="text-slate-700 hover:text-slate-900">
            ユーザ登録
          </Link>
          <Link to="/recipes/new" className="text-slate-700 hover:text-slate-900">
            レシピ登録
          </Link>
        </div>
      </div>
    </nav>
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Outlet />
    </main>
  </div>
);

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/recipes/new" element={<RecipeCreatePage />} />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
      <Route path="/recipes/:id/delete" element={<RecipeDeletePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
