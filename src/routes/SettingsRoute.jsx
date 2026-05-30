import * as React from "react";
import { SettingsPanel } from "../components";

const { Fragment } = React;

export default function SettingsRoute({ appSettings, onThemeModeChange, resolvedThemeMode }) {
  return (
    <Fragment>
      <SettingsPanel appSettings={appSettings} onThemeModeChange={onThemeModeChange} resolvedThemeMode={resolvedThemeMode} />
    </Fragment>
  );
}
