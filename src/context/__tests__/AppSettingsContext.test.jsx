import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { AppSettingsProvider, requireAppSettingsContext, useAppSettingsContext } from "../AppSettingsContext";

function AppSettingsConsumer() {
  const { resolvedThemeMode, settings } = useAppSettingsContext();

  return (
    <div>
      <span data-testid="theme-mode">{settings.themeMode}</span>
      <strong data-testid="resolved-theme-mode">{resolvedThemeMode}</strong>
    </div>
  );
}

describe("AppSettingsContext", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("provides app settings state to descendants", () => {
    render(
      <AppSettingsProvider>
        <AppSettingsConsumer />
      </AppSettingsProvider>,
    );

    expect(screen.getByTestId("theme-mode").textContent).toMatch(/system|dark|light/);
    expect(screen.getByTestId("resolved-theme-mode").textContent).toMatch(/dark|light/);
  });

  it("throws when the required app settings context value is missing", () => {
    expect(() => requireAppSettingsContext(null)).toThrow("useAppSettingsContext must be used inside AppSettingsProvider.");
  });
});
