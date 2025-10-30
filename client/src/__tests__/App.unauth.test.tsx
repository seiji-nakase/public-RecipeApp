/*
実行例: npm run test
概要: 未ログイン時にHTMLレスポンスが返るケースでエラーメッセージが表示されることを検証する。
*/

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { MemoryRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";

describe("HomePage unauthorized flow", () => {
  test("HTMLレスポンスを受け取った場合にログイン要求メッセージを表示する", async () => {
    const htmlResponse = new Response("<!DOCTYPE html><html></html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(htmlResponse);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("error").textContent).toContain("ログインが必要です");
  });
});
