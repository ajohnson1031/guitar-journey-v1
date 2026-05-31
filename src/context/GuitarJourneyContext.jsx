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

function useGuitarJourneyContext() {
  const context = useContext(GuitarJourneyContext);

  if (!context) {
    throw new Error("useGuitarJourneyContext must be used inside GuitarJourneyProvider.");
  }

  return context;
}

export { GuitarJourneyContext, GuitarJourneyProvider, useGuitarJourneyContext };
