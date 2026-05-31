import * as React from "react";
import useGuitarJourneyApp from "../hooks/useGuitarJourneyApp";

const { createContext, useContext } = React;

const GuitarJourneyContext = createContext(null);

function GuitarJourneyProvider({ audioInputSettings, children }) {
  const guitarJourneyState = useGuitarJourneyApp({
    audioInputSettings,
  });

  return <GuitarJourneyContext.Provider value={guitarJourneyState}>{children}</GuitarJourneyContext.Provider>;
}

function requireGuitarJourneyContext(context) {
  if (!context) {
    throw new Error("useGuitarJourneyContext must be used inside GuitarJourneyProvider.");
  }

  return context;
}

function useGuitarJourneyContext() {
  return requireGuitarJourneyContext(useContext(GuitarJourneyContext));
}

export { GuitarJourneyContext, GuitarJourneyProvider, requireGuitarJourneyContext, useGuitarJourneyContext };
