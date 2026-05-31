import { describe, expect, it } from "vitest";
import {
  ACCENT_COLOR_CHARTREUSE,
  ACCENT_COLOR_PURPLE,
  AUDIO_INPUT_MODE_ADVANCED,
  AUDIO_INPUT_MODE_STANDARD,
  DEFAULT_APP_SETTINGS,
  createAppSettings,
  createAudioInputSettings,
  getAudioInputConstraints,
  getResolvedAudioInputSettings,
  migrateAppSettings,
  normalizeAccentColor,
  normalizeAudioInputMode,
  normalizeThemeMode,
} from "../settingsStorageUtils";

describe("settingsStorageUtils", () => {
  it("migrates legacy settings with default audio settings and default accent color", () => {
    const settings = migrateAppSettings({
      themeMode: "light",
    });

    expect(settings.themeMode).toBe("light");
    expect(settings.accentColor).toBe(DEFAULT_APP_SETTINGS.accentColor);
    expect(settings.audioInputSettings).toEqual(DEFAULT_APP_SETTINGS.audioInputSettings);
  });

  it("normalizes invalid theme, accent, and audio input modes", () => {
    expect(normalizeThemeMode("bad-mode")).toBe(DEFAULT_APP_SETTINGS.themeMode);
    expect(normalizeAccentColor("neon")).toBe(DEFAULT_APP_SETTINGS.accentColor);
    expect(normalizeAudioInputMode("raw")).toBe(AUDIO_INPUT_MODE_STANDARD);
  });

  it("normalizes valid accent colors", () => {
    expect(normalizeAccentColor("Purple")).toBe(ACCENT_COLOR_PURPLE);
    expect(normalizeAccentColor("Chartreuse")).toBe(ACCENT_COLOR_CHARTREUSE);
  });

  it("creates audio input settings with boolean fallbacks", () => {
    const settings = createAudioInputSettings({
      inputMode: AUDIO_INPUT_MODE_ADVANCED,
      echoCancellation: false,
      noiseSuppression: "nope",
      autoGainControl: false,
    });

    expect(settings).toEqual({
      inputMode: AUDIO_INPUT_MODE_ADVANCED,
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: false,
    });
  });

  it("resolves standard mode to safe defaults even when saved advanced values are off", () => {
    const settings = getResolvedAudioInputSettings({
      inputMode: AUDIO_INPUT_MODE_STANDARD,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    });

    expect(settings).toEqual({
      inputMode: AUDIO_INPUT_MODE_STANDARD,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });

  it("builds safe standard mode getUserMedia constraints", () => {
    expect(
      getAudioInputConstraints({
        inputMode: AUDIO_INPUT_MODE_STANDARD,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }),
    ).toEqual({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });

  it("builds advanced mode getUserMedia constraints from saved toggles", () => {
    expect(
      getAudioInputConstraints({
        inputMode: AUDIO_INPUT_MODE_ADVANCED,
        echoCancellation: false,
        noiseSuppression: true,
        autoGainControl: false,
      }),
    ).toEqual({
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: false,
    });
  });

  it("includes accent and audio settings when creating app settings", () => {
    const settings = createAppSettings({
      themeMode: "system",
      accentColor: "chartreuse",
      audioInputSettings: {
        inputMode: AUDIO_INPUT_MODE_ADVANCED,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });

    expect(settings).toEqual({
      themeMode: "system",
      accentColor: "chartreuse",
      audioInputSettings: {
        inputMode: AUDIO_INPUT_MODE_ADVANCED,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });
  });
});
