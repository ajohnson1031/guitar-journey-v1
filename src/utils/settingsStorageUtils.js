const APP_SETTINGS_KEY = "guitar-journey-app-settings";

const THEME_MODE_SYSTEM = "system";
const THEME_MODE_DARK = "dark";
const THEME_MODE_LIGHT = "light";

const ACCENT_COLOR_BLUE = "blue";
const ACCENT_COLOR_PURPLE = "purple";
const ACCENT_COLOR_TEAL = "teal";
const ACCENT_COLOR_ROSE = "rose";
const ACCENT_COLOR_AMBER = "amber";
const ACCENT_COLOR_GREEN = "green";
const ACCENT_COLOR_CHARTREUSE = "chartreuse";
const ACCENT_COLOR_CYAN = "cyan";
const ACCENT_COLOR_MAGENTA = "magenta";

const AUDIO_INPUT_MODE_STANDARD = "standard";
const AUDIO_INPUT_MODE_ADVANCED = "advanced";

const AUDIO_INPUT_SETTING_KEYS = ["echoCancellation", "noiseSuppression", "autoGainControl"];
const ACCENT_COLOR_IDS = [
  ACCENT_COLOR_BLUE,
  ACCENT_COLOR_PURPLE,
  ACCENT_COLOR_TEAL,
  ACCENT_COLOR_ROSE,
  ACCENT_COLOR_AMBER,
  ACCENT_COLOR_GREEN,
  ACCENT_COLOR_CHARTREUSE,
  ACCENT_COLOR_CYAN,
  ACCENT_COLOR_MAGENTA,
];

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

const ACCENT_COLOR_OPTIONS = [
  {
    id: ACCENT_COLOR_BLUE,
    label: "Blue",
    description: "Classic Guitar Journey blue.",
    swatch: "#1b82e6",
  },
  {
    id: ACCENT_COLOR_PURPLE,
    label: "Purple",
    description: "A creative violet accent.",
    swatch: "#8b5cf6",
  },
  {
    id: ACCENT_COLOR_TEAL,
    label: "Teal",
    description: "A calm blue-green accent.",
    swatch: "#14b8a6",
  },
  {
    id: ACCENT_COLOR_ROSE,
    label: "Rose",
    description: "A warm rose accent.",
    swatch: "#e11d48",
  },
  {
    id: ACCENT_COLOR_AMBER,
    label: "Amber",
    description: "A golden practice accent.",
    swatch: "#d97706",
  },
  {
    id: ACCENT_COLOR_GREEN,
    label: "Green",
    description: "A growth-focused accent.",
    swatch: "#16a34a",
  },
  {
    id: ACCENT_COLOR_CHARTREUSE,
    label: "Chartreuse",
    description: "A bright electric accent.",
    swatch: "#a3e635",
  },
  {
    id: ACCENT_COLOR_CYAN,
    label: "Cyan",
    description: "A vivid neon-blue accent.",
    swatch: "#06b6d4",
  },
  {
    id: ACCENT_COLOR_MAGENTA,
    label: "Magenta",
    description: "A bold hot-pink accent.",
    swatch: "#d946ef",
  },
];

const AUDIO_INPUT_MODE_OPTIONS = [
  {
    id: AUDIO_INPUT_MODE_STANDARD,
    label: "Standard",
    description: "Safe defaults for normal practice recording.",
  },
  {
    id: AUDIO_INPUT_MODE_ADVANCED,
    label: "Advanced",
    description: "Adjust browser audio processing for testing and chord-recognition experiments.",
  },
];

const DEFAULT_AUDIO_INPUT_SETTINGS = {
  inputMode: AUDIO_INPUT_MODE_STANDARD,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const DEFAULT_APP_SETTINGS = {
  themeMode: THEME_MODE_DARK,
  accentColor: ACCENT_COLOR_BLUE,
  audioInputSettings: DEFAULT_AUDIO_INPUT_SETTINGS,
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

function normalizeAccentColor(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (ACCENT_COLOR_IDS.includes(normalizedValue)) {
    return normalizedValue;
  }

  return DEFAULT_APP_SETTINGS.accentColor;
}

function normalizeAudioInputMode(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if ([AUDIO_INPUT_MODE_STANDARD, AUDIO_INPUT_MODE_ADVANCED].includes(normalizedValue)) {
    return normalizedValue;
  }

  return DEFAULT_AUDIO_INPUT_SETTINGS.inputMode;
}

function normalizeBoolean(value, fallbackValue) {
  return typeof value === "boolean" ? value : fallbackValue;
}

function createAudioInputSettings(settings) {
  const parsed = isPlainObject(settings) ? settings : {};

  return {
    ...DEFAULT_AUDIO_INPUT_SETTINGS,
    ...parsed,
    inputMode: normalizeAudioInputMode(parsed.inputMode),
    echoCancellation: normalizeBoolean(parsed.echoCancellation, DEFAULT_AUDIO_INPUT_SETTINGS.echoCancellation),
    noiseSuppression: normalizeBoolean(parsed.noiseSuppression, DEFAULT_AUDIO_INPUT_SETTINGS.noiseSuppression),
    autoGainControl: normalizeBoolean(parsed.autoGainControl, DEFAULT_AUDIO_INPUT_SETTINGS.autoGainControl),
  };
}

function getResolvedAudioInputSettings(settings) {
  const normalizedSettings = createAudioInputSettings(settings);

  if (normalizedSettings.inputMode !== AUDIO_INPUT_MODE_STANDARD) {
    return normalizedSettings;
  }

  return {
    ...normalizedSettings,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}

function getAudioInputConstraints(settings) {
  const resolvedSettings = getResolvedAudioInputSettings(settings);

  return {
    echoCancellation: resolvedSettings.echoCancellation,
    noiseSuppression: resolvedSettings.noiseSuppression,
    autoGainControl: resolvedSettings.autoGainControl,
  };
}

function migrateAppSettings(settings) {
  const parsed = isPlainObject(settings) ? settings : {};

  return {
    ...DEFAULT_APP_SETTINGS,
    ...parsed,
    themeMode: normalizeThemeMode(parsed.themeMode),
    accentColor: normalizeAccentColor(parsed.accentColor),
    audioInputSettings: createAudioInputSettings(parsed.audioInputSettings),
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
  ACCENT_COLOR_AMBER,
  ACCENT_COLOR_BLUE,
  ACCENT_COLOR_CHARTREUSE,
  ACCENT_COLOR_CYAN,
  ACCENT_COLOR_GREEN,
  ACCENT_COLOR_MAGENTA,
  ACCENT_COLOR_OPTIONS,
  ACCENT_COLOR_PURPLE,
  ACCENT_COLOR_ROSE,
  ACCENT_COLOR_TEAL,
  APP_SETTINGS_KEY,
  AUDIO_INPUT_MODE_ADVANCED,
  AUDIO_INPUT_MODE_OPTIONS,
  AUDIO_INPUT_MODE_STANDARD,
  AUDIO_INPUT_SETTING_KEYS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_AUDIO_INPUT_SETTINGS,
  THEME_MODE_DARK,
  THEME_MODE_LIGHT,
  THEME_MODE_OPTIONS,
  THEME_MODE_SYSTEM,
  clearAppSettings,
  createAppSettings,
  createAudioInputSettings,
  getAudioInputConstraints,
  getResolvedAudioInputSettings,
  loadAppSettings,
  migrateAppSettings,
  normalizeAccentColor,
  normalizeAudioInputMode,
  normalizeThemeMode,
  saveAppSettings,
};
