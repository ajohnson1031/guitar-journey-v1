import * as React from "react";
import {
  THEME_MODE_DARK,
  THEME_MODE_LIGHT,
  THEME_MODE_SYSTEM,
  createAudioInputSettings,
  loadAppSettings,
  normalizeAccentColor,
  normalizeAudioInputMode,
  saveAppSettings,
} from "../utils/settingsStorageUtils";

const { useEffect, useMemo, useState } = React;

function getSystemThemeMode() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return THEME_MODE_DARK;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? THEME_MODE_LIGHT : THEME_MODE_DARK;
}

function resolveThemeMode(themeMode, systemThemeMode) {
  if (themeMode === THEME_MODE_SYSTEM) {
    return systemThemeMode;
  }

  return themeMode === THEME_MODE_LIGHT ? THEME_MODE_LIGHT : THEME_MODE_DARK;
}

export default function useAppSettings() {
  const [settings, setSettings] = useState(() => loadAppSettings());
  const [systemThemeMode, setSystemThemeMode] = useState(() => getSystemThemeMode());

  const resolvedThemeMode = useMemo(() => {
    return resolveThemeMode(settings.themeMode, systemThemeMode);
  }, [settings.themeMode, systemThemeMode]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    function handleSystemThemeChange(event) {
      setSystemThemeMode(event.matches ? THEME_MODE_LIGHT : THEME_MODE_DARK);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      };
    }

    mediaQuery.addListener(handleSystemThemeChange);

    return () => {
      mediaQuery.removeListener(handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.theme = resolvedThemeMode;
    document.documentElement.dataset.themePreference = settings.themeMode;
    document.documentElement.dataset.accent = settings.accentColor;
    document.documentElement.style.colorScheme = resolvedThemeMode;
  }, [resolvedThemeMode, settings.accentColor, settings.themeMode]);

  function updateThemeMode(themeMode) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      themeMode,
    }));
  }

  function updateAccentColor(accentColor) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      accentColor: normalizeAccentColor(accentColor),
    }));
  }

  function updateAudioInputMode(inputMode) {
    setSettings((currentSettings) => {
      const currentAudioInputSettings = createAudioInputSettings(currentSettings.audioInputSettings);

      return {
        ...currentSettings,
        audioInputSettings: {
          ...currentAudioInputSettings,
          inputMode: normalizeAudioInputMode(inputMode),
        },
      };
    });
  }

  function updateAudioInputSetting(settingName, value) {
    setSettings((currentSettings) => {
      const currentAudioInputSettings = createAudioInputSettings(currentSettings.audioInputSettings);

      if (!(settingName in currentAudioInputSettings) || settingName === "inputMode") {
        return currentSettings;
      }

      return {
        ...currentSettings,
        audioInputSettings: {
          ...currentAudioInputSettings,
          [settingName]: Boolean(value),
        },
      };
    });
  }

  return {
    settings,
    resolvedThemeMode,
    updateAccentColor,
    updateAudioInputMode,
    updateAudioInputSetting,
    updateThemeMode,
  };
}
