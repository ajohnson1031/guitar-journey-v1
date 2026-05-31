import * as React from "react";
import useAppSettings from "../hooks/useAppSettings";

const { createContext, useContext } = React;

const AppSettingsContext = createContext(null);

function AppSettingsProvider({ children }) {
  const appSettingsState = useAppSettings();

  return <AppSettingsContext.Provider value={appSettingsState}>{children}</AppSettingsContext.Provider>;
}

function requireAppSettingsContext(context) {
  if (!context) {
    throw new Error("useAppSettingsContext must be used inside AppSettingsProvider.");
  }

  return context;
}

function useAppSettingsContext() {
  return requireAppSettingsContext(useContext(AppSettingsContext));
}

export { AppSettingsContext, AppSettingsProvider, requireAppSettingsContext, useAppSettingsContext };
