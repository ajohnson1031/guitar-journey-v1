import { describe, expect, it } from "vitest";
import {
  AUDIO_INPUT_MODE_ADVANCED,
  AUDIO_INPUT_MODE_STANDARD,
  DEFAULT_APP_SETTINGS,
  createAppSettings,
  createAudioInputSettings,
  getAudioInputConstraints,
  getResolvedAudioInputSettings,
  migrateAppSettings,
  normalizeAudioInputMode,
  normalizeThemeMode,
} from "../settingsStorageUtils";

describe("settingsStorageUtils", () => {
  it("migrates legacy settings with default audio settings", () => {
    const settings = migrateAppSettings({
      themeMode: "light",
    });

    expect(settings.themeMode).toBe("light");
    expect(settings.audioInputSettings).toEqual(DEFAULT_APP_SETTINGS.audioInputSettings);
  });

  it("normalizes invalid theme and audio input modes", () => {
    expect(normalizeThemeMode("bad-mode")).toBe(DEFAULT_APP_SETTINGS.themeMode);
    expect(normalizeAudioInputMode("raw")).toBe(AUDIO_INPUT_MODE_STANDARD);
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

  it("includes audio settings when creating app settings", () => {
    const settings = createAppSettings({
      themeMode: "system",
      audioInputSettings: {
        inputMode: AUDIO_INPUT_MODE_ADVANCED,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });

    expect(settings).toEqual({
      themeMode: "system",
      audioInputSettings: {
        inputMode: AUDIO_INPUT_MODE_ADVANCED,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });
  });
});
