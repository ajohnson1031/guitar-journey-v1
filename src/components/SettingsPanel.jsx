import * as React from "react";
import { getAudioRecordingSupportDetails, testAudioRecordingAccess } from "../utils/audioRecordingUtils";
import { getRecordingStorageSummary } from "../utils/recordingStorageUtils";
import { THEME_MODE_OPTIONS } from "../utils/settingsStorageUtils";

const { Fragment, useEffect, useMemo, useState } = React;

export default function SettingsPanel({ appSettings, onThemeModeChange, resolvedThemeMode }) {
  const audioSupport = useMemo(() => getAudioRecordingSupportDetails(), []);
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [microphoneTestMessage, setMicrophoneTestMessage] = useState("");
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

  async function handleTestMicrophone() {
    if (!audioSupport.isSupported) {
      setMicrophoneTestMessage("Recording is not supported in this browser.");
      return;
    }

    setIsTestingMicrophone(true);
    setMicrophoneTestMessage("Requesting microphone access...");

    const result = await testAudioRecordingAccess();

    setMicrophoneTestMessage(result.message);
    setIsTestingMicrophone(false);
  }

  return (
    <Fragment>
      <section className="panel-card settings-panel">
        <div className="settings-hero">
          <p className="eyebrow">Settings</p>
          <h2>App preferences</h2>
          <p>
            Configure how Guitar Journey looks, stores progress, and handles audio. Some options are placeholders for upcoming features.
          </p>
        </div>

        <div className="settings-grid">
          <SettingsSection
            title="Appearance"
            eyebrow="Theme"
            description="Choose how the app should look. System follows this device’s light or dark preference."
          >
            <div className="settings-option-grid" role="group" aria-label="Theme mode">
              {THEME_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`settings-option-card ${appSettings.themeMode === option.id ? "is-selected" : ""}`}
                  onClick={() => onThemeModeChange(option.id)}
                >
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>

            <div className="settings-placeholder-row">
              <span>Active theme</span>
              <strong>{resolvedThemeMode === "light" ? "Light" : "Dark"}</strong>
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

          <SettingsSection
            title="Audio"
            eyebrow="Input / Output"
            description="Review recording support, test microphone access, and confirm where practice recordings are stored."
          >
            <div className="settings-status-grid">
              <StatusCard
                label="Recording support"
                value={audioSupport.isSupported ? "Supported" : "Unavailable"}
                tone={audioSupport.isSupported ? "success" : "danger"}
              />
              <StatusCard label="Detected format" value={audioSupport.supportedMimeTypeLabel} />
              <StatusCard
                label="Local recordings"
                value={recordingStorageSummary.label}
                tone={recordingStorageSummary.count > 0 ? "success" : "neutral"}
              />
            </div>

            <div className="settings-action-panel">
              <div>
                <strong>Test microphone</strong>
                <p>
                  This checks browser microphone permission and immediately releases the input. No test audio is saved.
                </p>
              </div>

              <button type="button" className="selected-button" onClick={handleTestMicrophone} disabled={isTestingMicrophone || !audioSupport.isSupported}>
                {isTestingMicrophone ? "Testing..." : "Test Microphone"}
              </button>
            </div>

            {microphoneTestMessage ? <p className="settings-inline-message">{microphoneTestMessage}</p> : null}

            <div className="settings-note-card">
              <strong>Local audio note</strong>
              <p>
                Practice recordings are stored locally in this browser with IndexedDB. They are not synced across devices yet, and they can be removed if browser site data is cleared.
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
