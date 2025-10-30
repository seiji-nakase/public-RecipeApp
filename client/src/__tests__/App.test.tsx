/*
実行例: npm run test
概要: HomePageコンポーネントがAPIレスポンスを表示できるかどうかをVitestで検証する。
*/

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { MemoryRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";

describe("HomePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("APIから取得したレシピを表示する", async () => {
    const mockRecipes = [
      { id: 1, title: "パンケーキ", ingredients: "粉と卵", steps: "混ぜて焼く", notes: "甘さ控えめ" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockRecipes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
    expect(await screen.findByText("パンケーキ")).toBeInTheDocument();

    // 詳細はトグル後に表示される
    expect(await screen.findByRole("link", { name: "パンケーキ" })).toBeInTheDocument();
  });
});
