import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppSidebar, DashboardNav } from "./components";
import { useAppSettings, useGuitarJourneyApp } from "./hooks";
import {
  DashboardRoute,
  EditSongRoute,
  HistoryRoute,
  NewSongRoute,
  SettingsRoute,
  SongSectionsRoute,
  TransitionsRoute,
  WeeklyPlanRoute,
} from "./routes";

import "./App.css";

const { Fragment } = React;

export default function App() {
  const {
    settings: appSettings,
    resolvedThemeMode,
    updateAudioInputMode,
    updateAudioInputSetting,
    updateThemeMode,
  } = useAppSettings();

  const {
    dashboardRouteProps,
    editSongRouteProps,
    historyRouteProps,
    newSongRouteProps,
    sidebarProps,
    songSectionsRouteProps,
    transitionsRouteProps,
    weeklyPlanRouteProps,
  } = useGuitarJourneyApp({
    audioInputSettings: appSettings.audioInputSettings,
  });

  return (
    <Fragment>
      <main className="app-shell">
        <div className="app-grid">
          <AppSidebar {...sidebarProps} />

          <section className="main-content">
            <DashboardNav />

            <Routes>
              <Route index element={<DashboardRoute {...dashboardRouteProps} />} />

              <Route path="transitions" element={<TransitionsRoute {...transitionsRouteProps} />} />

              <Route path="sections" element={<SongSectionsRoute {...songSectionsRouteProps} />} />

              <Route path="history" element={<HistoryRoute {...historyRouteProps} />} />

              <Route path="weekly-plan" element={<WeeklyPlanRoute {...weeklyPlanRouteProps} />} />

              <Route path="songs/new" element={<NewSongRoute {...newSongRouteProps} />} />

              <Route path="songs/edit/:songId" element={<EditSongRoute {...editSongRouteProps} />} />

              <Route
                path="settings"
                element={
                  <SettingsRoute
                    appSettings={appSettings}
                    onAudioInputModeChange={updateAudioInputMode}
                    onAudioInputSettingChange={updateAudioInputSetting}
                    onThemeModeChange={updateThemeMode}
                    resolvedThemeMode={resolvedThemeMode}
                  />
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </div>
      </main>
    </Fragment>
  );
}
