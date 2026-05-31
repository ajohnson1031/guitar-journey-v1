import * as React from "react";
import { SettingsPanel } from "../components";
import { useAppRuntimeContext, useAppSettingsContext } from "../context";

const { Fragment } = React;

export default function SettingsRoute() {
  const { onProgressImported } = useAppRuntimeContext();

  const {
    settings: appSettings,
    resolvedThemeMode,
    updateAccentColor,
    updateAudioInputMode,
    updateAudioInputSetting,
    updateThemeMode,
  } = useAppSettingsContext();

  return (
    <Fragment>
      <SettingsPanel
        appSettings={appSettings}
        onAccentColorChange={updateAccentColor}
        onAudioInputModeChange={updateAudioInputMode}
        onAudioInputSettingChange={updateAudioInputSetting}
        onProgressImported={onProgressImported}
        onThemeModeChange={updateThemeMode}
        resolvedThemeMode={resolvedThemeMode}
      />
    </Fragment>
  );
}
