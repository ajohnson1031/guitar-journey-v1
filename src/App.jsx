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
    dashboardRouteProps,
    editSongRouteProps,
    historyRouteProps,
    newSongRouteProps,
    sidebarProps,
    songSectionsRouteProps,
    transitionsRouteProps,
    weeklyPlanRouteProps,
  } = useGuitarJourneyContext();

  return (
    <Fragment>
      <main className="app-shell">
        <div className="app-grid">
          <AppSidebar {...sidebarProps} />

          <section className="main-content">
            <DashboardNav activeSession={activeSessionProps} />

            <Routes>
              <Route
                index
                element={
                  <DashboardRoute
                    {...dashboardRouteProps}
                    localProgressProps={{
                      masteredCount: sidebarProps.masteredCount,
                      onResetLocalProgress: sidebarProps.onResetLocalProgress,
                      sessionHistory: sidebarProps.sessionHistory,
                      totalPracticeMinutes: sidebarProps.totalPracticeMinutes,
                      transitionScores: sidebarProps.transitionScores,
                    }}
                  />
                }
              />

              <Route path="transitions" element={<TransitionsRoute {...transitionsRouteProps} />} />

              <Route path="sections" element={<SongSectionsRoute {...songSectionsRouteProps} />} />

              <Route path="history" element={<HistoryRoute {...historyRouteProps} />} />

              <Route path="weekly-plan" element={<WeeklyPlanRoute {...weeklyPlanRouteProps} />} />

              <Route path="songs/new" element={<NewSongRoute {...newSongRouteProps} />} />

              <Route path="songs/edit/:songId" element={<EditSongRoute {...editSongRouteProps} />} />

              <Route path="settings" element={<SettingsRoute onProgressImported={onProgressImported} />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </div>
      </main>
    </Fragment>
  );
}
