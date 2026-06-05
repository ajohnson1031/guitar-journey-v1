import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppSidebar, DashboardNav } from "./components";
import {
  AppRuntimeProvider,
  AppSettingsProvider,
  GuitarJourneyProvider,
  useAppSettingsContext,
  useGuitarJourneyContext,
} from "./context";
import {
  DashboardRoute,
  EditSongRoute,
  HistoryRoute,
  NewSongRoute,
  ProgressRoute,
  RecordingsRoute,
  SearchRoute,
  SettingsRoute,
  SongSectionsRoute,
  TransitionsRoute,
  WeeklyPlanRoute,
} from "./routes";

import "./App.css";

const { Fragment, useCallback, useState } = React;

export default function App() {
  const [appRuntimeKey, setAppRuntimeKey] = useState(0);

  const handleProgressImported = useCallback(() => {
    setAppRuntimeKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <AppRuntimeProvider onProgressImported={handleProgressImported}>
      <AppRuntime key={appRuntimeKey} />
    </AppRuntimeProvider>
  );
}

function AppRuntime() {
  return (
    <AppSettingsProvider>
      <GuitarJourneyRuntime />
    </AppSettingsProvider>
  );
}

function GuitarJourneyRuntime() {
  const { settings: appSettings } = useAppSettingsContext();

  return (
    <GuitarJourneyProvider audioInputSettings={appSettings.audioInputSettings}>
      <AppLayout />
    </GuitarJourneyProvider>
  );
}

function AppLayout() {
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
              <Route path="search" element={<SearchRoute />} />
              <Route path="transitions" element={<TransitionsRoute />} />
              <Route path="sections" element={<SongSectionsRoute />} />
              <Route path="history" element={<HistoryRoute />} />
              <Route path="progress" element={<ProgressRoute />} />
              <Route path="recordings" element={<RecordingsRoute />} />
              <Route path="weekly-plan" element={<WeeklyPlanRoute />} />
              <Route path="songs/new" element={<NewSongRoute />} />
              <Route path="songs/edit/:songId" element={<EditSongRoute />} />
              <Route path="settings" element={<SettingsRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </div>
      </main>
    </Fragment>
  );
}
