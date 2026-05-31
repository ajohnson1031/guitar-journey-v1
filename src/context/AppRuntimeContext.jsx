import * as React from "react";

const { createContext, useContext, useMemo } = React;

const AppRuntimeContext = createContext(null);

function AppRuntimeProvider({ children, onProgressImported }) {
  const runtimeState = useMemo(
    () => ({
      onProgressImported,
    }),
    [onProgressImported],
  );

  return <AppRuntimeContext.Provider value={runtimeState}>{children}</AppRuntimeContext.Provider>;
}

function requireAppRuntimeContext(context) {
  if (!context) {
    throw new Error("useAppRuntimeContext must be used inside AppRuntimeProvider.");
  }

  return context;
}

function useAppRuntimeContext() {
  return requireAppRuntimeContext(useContext(AppRuntimeContext));
}

export { AppRuntimeContext, AppRuntimeProvider, requireAppRuntimeContext, useAppRuntimeContext };
