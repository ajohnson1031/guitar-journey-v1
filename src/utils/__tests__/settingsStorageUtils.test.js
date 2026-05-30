import { beforeEach, describe, expect, it } from "vitest";
import {
  APP_SETTINGS_KEY,
  DEFAULT_APP_SETTINGS,
  THEME_MODE_DARK,
  THEME_MODE_LIGHT,
  THEME_MODE_SYSTEM,
  clearAppSettings,
  createAppSettings,
  loadAppSettings,
  migrateAppSettings,
  normalizeThemeMode,
  saveAppSettings,
} from "../settingsStorageUtils";

describe("settingsStorageUtils", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns default app settings when localStorage is empty", () => {
    expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("returns default app settings when stored JSON is invalid", () => {
    window.localStorage.setItem(APP_SETTINGS_KEY, "{bad json");

    expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("normalizes supported theme modes", () => {
    expect(normalizeThemeMode("system")).toBe(THEME_MODE_SYSTEM);
    expect(normalizeThemeMode("dark")).toBe(THEME_MODE_DARK);
    expect(normalizeThemeMode("light")).toBe(THEME_MODE_LIGHT);
    expect(normalizeThemeMode("LIGHT")).toBe(THEME_MODE_LIGHT);
    expect(normalizeThemeMode("bad")).toBe(DEFAULT_APP_SETTINGS.themeMode);
  });

  it("migrates app settings into the current shape", () => {
    expect(migrateAppSettings({ themeMode: "light", extra: true })).toEqual({
      themeMode: THEME_MODE_LIGHT,
      extra: true,
    });

    expect(migrateAppSettings(null)).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("creates app settings in the current shape", () => {
    expect(createAppSettings({ themeMode: "system" })).toEqual({
      themeMode: THEME_MODE_SYSTEM,
    });
  });

  it("saves app settings to localStorage", () => {
    saveAppSettings({ themeMode: "light" });

    expect(JSON.parse(window.localStorage.getItem(APP_SETTINGS_KEY))).toEqual({
      themeMode: THEME_MODE_LIGHT,
    });
  });

  it("loads saved app settings from localStorage", () => {
    window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ themeMode: "system" }));

    expect(loadAppSettings()).toEqual({
      themeMode: THEME_MODE_SYSTEM,
    });
  });

  it("clears app settings from localStorage", () => {
    window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ themeMode: "light" }));

    clearAppSettings();

    expect(window.localStorage.getItem(APP_SETTINGS_KEY)).toBeNull();
  });
});
