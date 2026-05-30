import * as React from "react";
import { SettingsPanel } from "../components";

const { Fragment } = React;

export default function SettingsRoute({
  appSettings,
  onAudioInputModeChange,
  onAudioInputSettingChange,
  onProgressImported,
  onThemeModeChange,
  resolvedThemeMode,
}) {
  return (
    <Fragment>
      <SettingsPanel
        appSettings={appSettings}
        onAudioInputModeChange={onAudioInputModeChange}
        onAudioInputSettingChange={onAudioInputSettingChange}
        onProgressImported={onProgressImported}
        onThemeModeChange={onThemeModeChange}
        resolvedThemeMode={resolvedThemeMode}
      />
    </Fragment>
  );
}
