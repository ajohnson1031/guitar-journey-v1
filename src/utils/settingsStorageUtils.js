const APP_SETTINGS_KEY = "guitar-journey-app-settings";

const THEME_MODE_SYSTEM = "system";
const THEME_MODE_DARK = "dark";
const THEME_MODE_LIGHT = "light";

const THEME_MODE_OPTIONS = [
  {
    id: THEME_MODE_SYSTEM,
    label: "System",
    description: "Follow this device’s appearance setting.",
  },
  {
    id: THEME_MODE_DARK,
    label: "Dark",
    description: "Use the original dark Guitar Journey theme.",
  },
  {
    id: THEME_MODE_LIGHT,
    label: "Light",
    description: "Use a brighter theme for daytime practice.",
  },
];

const DEFAULT_APP_SETTINGS = {
  themeMode: THEME_MODE_DARK,
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeThemeMode(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if ([THEME_MODE_SYSTEM, THEME_MODE_DARK, THEME_MODE_LIGHT].includes(normalizedValue)) {
    return normalizedValue;
  }

  return DEFAULT_APP_SETTINGS.themeMode;
}

function migrateAppSettings(settings) {
  const parsed = isPlainObject(settings) ? settings : {};

  return {
    ...DEFAULT_APP_SETTINGS,
    ...parsed,
    themeMode: normalizeThemeMode(parsed.themeMode),
  };
}

function loadAppSettings() {
  try {
    if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;

    const raw = window.localStorage.getItem(APP_SETTINGS_KEY);

    if (!raw) return DEFAULT_APP_SETTINGS;

    return migrateAppSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function createAppSettings(settings) {
  return migrateAppSettings(settings);
}

function saveAppSettings(settings) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(createAppSettings(settings)));
}

function clearAppSettings() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(APP_SETTINGS_KEY);
}

export {
  APP_SETTINGS_KEY,
  DEFAULT_APP_SETTINGS,
  THEME_MODE_DARK,
  THEME_MODE_LIGHT,
  THEME_MODE_OPTIONS,
  THEME_MODE_SYSTEM,
  clearAppSettings,
  createAppSettings,
  loadAppSettings,
  migrateAppSettings,
  normalizeThemeMode,
  saveAppSettings,
};
