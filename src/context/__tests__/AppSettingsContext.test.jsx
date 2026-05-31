import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppSettingsProvider, useAppSettingsContext } from "../AppSettingsContext";

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

  it("throws when used outside AppSettingsProvider", () => {
    function renderOutsideProvider() {
      render(<AppSettingsConsumer />);
    }

    expect(renderOutsideProvider).toThrow("useAppSettingsContext must be used inside AppSettingsProvider.");
  });
});
