import * as React from "react";
import { useMicrophoneTest } from "../hooks";
import { getAudioRecordingSupportDetails } from "../utils/audioRecordingUtils";
import { getLevelBarStates } from "../utils/microphoneTestUtils";
import { getRecordingStorageSummary } from "../utils/recordingStorageUtils";
import { THEME_MODE_OPTIONS } from "../utils/settingsStorageUtils";

const { Fragment, useEffect, useMemo, useState } = React;

export default function SettingsPanel({ appSettings, onThemeModeChange }) {
  const audioSupport = useMemo(() => getAudioRecordingSupportDetails(), []);
  const { isTestingMicrophone, microphoneLevel, microphoneTestMessage, startMicrophoneTest, stopMicrophoneTest } = useMicrophoneTest();

  const [recordingStorageSummary, setRecordingStorageSummary] = useState({
    count: 0,
    isSupported: false,
    label: "Checking...",
  });

  useEffect(() => {
    let isMounted = true;

    getRecordingStorageSummary()
      .then((summary) => {
        if (isMounted) {
          setRecordingStorageSummary(summary);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecordingStorageSummary({
            count: 0,
            isSupported: false,
            label: "Storage unavailable",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleMicrophoneTestClick() {
    if (!audioSupport.isSupported) return;

    if (isTestingMicrophone) {
      void stopMicrophoneTest();
      return;
    }

    void startMicrophoneTest();
  }

  return (
    <Fragment>
      <section className="panel-card settings-panel">
        <div className="settings-hero">
          <p className="eyebrow">Settings</p>
          <h2>App preferences</h2>
          <p>Configure how Guitar Journey looks, stores progress, and handles audio. Some options are placeholders for upcoming features.</p>
        </div>

        <div className="settings-grid">
          <SettingsSection title="Appearance" eyebrow="Theme" description="Choose how the app should look. System follows this device’s light or dark preference.">
            <div className="settings-option-grid" role="group" aria-label="Theme mode">
              {THEME_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`settings-option-card ${appSettings.themeMode === option.id ? "is-selected" : ""}`}
                  onClick={() => onThemeModeChange(option.id)}
                >
                  <div className="settings-option-header">
                    <span>{option.label}</span>

                    {appSettings.themeMode === option.id ? <strong className="settings-active-badge">Active</strong> : null}
                  </div>

                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Storage"
            eyebrow="Persistence"
            description="Local progress is currently stored on this device. Later, this section can support user-configured databases or online sync targets."
          >
            <div className="settings-placeholder-row">
              <span>Progress and settings</span>
              <strong>localStorage</strong>
            </div>
            <div className="settings-placeholder-row">
              <span>Session recordings</span>
              <strong>IndexedDB</strong>
            </div>
            <div className="settings-placeholder-row">
              <span>Database configuration</span>
              <strong>Planned</strong>
            </div>
          </SettingsSection>

          <SettingsSection title="Audio" eyebrow="Input / Output" description="Review recording support, test microphone access, and confirm where practice recordings are stored.">
            <div className="settings-status-grid">
              <StatusCard label="Recording support" value={audioSupport.isSupported ? "Supported" : "Unavailable"} tone={audioSupport.isSupported ? "success" : "danger"} />
              <StatusCard label="Detected format" value={audioSupport.supportedMimeTypeLabel} />
              <StatusCard label="Local recordings" value={recordingStorageSummary.label} tone={recordingStorageSummary.count > 0 ? "success" : "neutral"} />
            </div>

            <div className="settings-action-panel settings-audio-test-panel">
              <div>
                <strong>Test microphone</strong>
                <p>
                  This checks browser microphone permission and shows live input level. The mic stays active until you stop the test or leave Settings. No test audio is saved.{" "}
                  {microphoneTestMessage ? (
                    <span className={`settings-inline-message ${!isTestingMicrophone ? "settings-inline-message-stopped" : ""}`}>{microphoneTestMessage}</span>
                  ) : null}
                </p>
              </div>

              <button
                type="button"
                className={`selected-button microphone-test-button ${isTestingMicrophone ? "is-testing" : ""}`}
                onClick={handleMicrophoneTestClick}
                disabled={!audioSupport.isSupported}
              >
                {isTestingMicrophone ? "Stop Test" : "Test Microphone"}
              </button>

              <MicrophoneLevelMeter isActive={isTestingMicrophone} level={microphoneLevel} />
            </div>

            <div className="settings-note-card">
              <strong>Local audio note</strong>
              <p>
                Practice recordings are stored locally in this browser with IndexedDB. They are not synced across devices yet, and they can be removed if browser site data is
                cleared.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            title="About"
            eyebrow="Guitar Journey"
            description="A focused practice app for building songs through chords, timing, transitions, rhythm, and real session history."
          >
            <div className="settings-placeholder-row">
              <span>Version</span>
              <strong>Local app</strong>
            </div>
          </SettingsSection>
        </div>
      </section>
    </Fragment>
  );
}

function SettingsSection({ children, description, eyebrow, title }) {
  return (
    <article className="settings-section-card">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="settings-section-content">{children}</div>
    </article>
  );
}

function StatusCard({ label, tone = "neutral", value }) {
  return (
    <div className={`settings-status-card settings-status-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MicrophoneLevelMeter({ isActive, level }) {
  const levelBars = getLevelBarStates(level, 10);

  return (
    <div className={`microphone-level-meter ${isActive ? "is-active" : ""}`} aria-label="Microphone input level" aria-live="polite">
      {levelBars.map((isLevelActive, index) => (
        <span key={index} className={`microphone-level-bar ${isLevelActive ? "is-level-active" : ""}`} />
      ))}
    </div>
  );
}
