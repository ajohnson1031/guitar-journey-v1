import * as React from "react";
import useAppSettings from "../hooks/useAppSettings";

const { createContext, useContext } = React;

const AppSettingsContext = createContext(null);

function AppSettingsProvider({ children }) {
  const appSettingsState = useAppSettings();

  return <AppSettingsContext.Provider value={appSettingsState}>{children}</AppSettingsContext.Provider>;
}

function useAppSettingsContext() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettingsContext must be used inside AppSettingsProvider.");
  }

  return context;
}

export { AppSettingsContext, AppSettingsProvider, useAppSettingsContext };
