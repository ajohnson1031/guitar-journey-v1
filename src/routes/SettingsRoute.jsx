import * as React from "react";
import { SettingsPanel } from "../components";
import { useAppSettingsContext } from "../context";

const { Fragment } = React;

export default function SettingsRoute({ onProgressImported }) {
  const {
    settings: appSettings,
    resolvedThemeMode,
    updateAudioInputMode,
    updateAudioInputSetting,
    updateThemeMode,
  } = useAppSettingsContext();

  return (
    <Fragment>
      <SettingsPanel
        appSettings={appSettings}
        onAudioInputModeChange={updateAudioInputMode}
        onAudioInputSettingChange={updateAudioInputSetting}
        onProgressImported={onProgressImported}
        onThemeModeChange={updateThemeMode}
        resolvedThemeMode={resolvedThemeMode}
      />
    </Fragment>
  );
}
