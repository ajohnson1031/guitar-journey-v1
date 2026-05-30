import * as React from "react";
import { SettingsPanel } from "../components";

const { Fragment } = React;

export default function SettingsRoute({ appSettings, onAudioInputModeChange, onAudioInputSettingChange, onThemeModeChange, resolvedThemeMode }) {
  return (
    <Fragment>
      <SettingsPanel
        appSettings={appSettings}
        onAudioInputModeChange={onAudioInputModeChange}
        onAudioInputSettingChange={onAudioInputSettingChange}
        onThemeModeChange={onThemeModeChange}
        resolvedThemeMode={resolvedThemeMode}
      />
    </Fragment>
  );
}
