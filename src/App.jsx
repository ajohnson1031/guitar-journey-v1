import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppSidebar, DashboardNav } from "./components";
import { AppSettingsProvider, GuitarJourneyProvider, useAppSettingsContext, useGuitarJourneyContext } from "./context";
import { DashboardRoute, EditSongRoute, HistoryRoute, NewSongRoute, SettingsRoute, SongSectionsRoute, TransitionsRoute, WeeklyPlanRoute } from "./routes";

import "./App.css";

const { Fragment, useState } = React;

export default function App() {
  const [appRuntimeKey, setAppRuntimeKey] = useState(0);

  function handleProgressImported() {
    setAppRuntimeKey((currentKey) => currentKey + 1);
  }

  return <AppRuntime key={appRuntimeKey} onProgressImported={handleProgressImported} />;
}

function AppRuntime({ onProgressImported }) {
  return (
    <AppSettingsProvider>
      <GuitarJourneyRuntime onProgressImported={onProgressImported} />
    </AppSettingsProvider>
  );
}

function GuitarJourneyRuntime({ onProgressImported }) {
  const { settings: appSettings } = useAppSettingsContext();

  return (
    <GuitarJourneyProvider audioInputSettings={appSettings.audioInputSettings}>
      <AppLayout onProgressImported={onProgressImported} />
    </GuitarJourneyProvider>
  );
}

function AppLayout({ onProgressImported }) {
  const {
    activeSessionProps,
    sidebarProps,
  } = useGuitarJourneyContext();

  return (
    <Fragment>
      <main className="app-shell">
        <div className="app-grid">
          <AppSidebar {...sidebarProps} />

          <section className="main-content">
            <DashboardNav activeSession={activeSessionProps} />

            <Routes>
              <Route index element={<DashboardRoute />} />

              <Route path="transitions" element={<TransitionsRoute />} />

              <Route path="sections" element={<SongSectionsRoute />} />

              <Route path="history" element={<HistoryRoute />} />

              <Route path="weekly-plan" element={<WeeklyPlanRoute />} />

              <Route path="songs/new" element={<NewSongRoute />} />

              <Route path="songs/edit/:songId" element={<EditSongRoute />} />

              <Route path="settings" element={<SettingsRoute onProgressImported={onProgressImported} />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </div>
      </main>
    </Fragment>
  );
}
