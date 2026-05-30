import * as React from "react";
import { useMicrophoneTest } from "../hooks";
import { getAudioRecordingSupportDetails } from "../utils/audioRecordingUtils";
import { getLevelBarStates } from "../utils/microphoneTestUtils";
import { applyProgressBackup, createProgressBackup, getProgressBackupSummary, parseProgressBackup } from "../utils/progressBackupUtils";
import { getRecordingStorageSummary } from "../utils/recordingStorageUtils";
import { THEME_MODE_OPTIONS, loadAppSettings } from "../utils/settingsStorageUtils";
import { loadStoredProgress } from "../utils/storageUtils";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useEffect, useMemo, useRef, useState } = React;

const AUDIO_SETTING_ROWS = [
  {
    label: "Input mode",
    value: "Standard",
    status: "Active",
    description: "Best for normal practice recording.",
  },
  {
    label: "Echo cancellation",
    value: "On by default",
    status: "Browser managed",
    description: "Helps reduce speaker feedback during recording.",
  },
  {
    label: "Noise suppression",
    value: "On by default",
    status: "Browser managed",
    description: "Helps reduce room noise for cleaner practice takes.",
  },
  {
    label: "Auto gain control",
    value: "On by default",
    status: "Browser managed",
    description: "Helps balance quiet and loud input automatically.",
  },
];

function getProgressBackupFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `guitar-journey-progress-${timestamp}.json`;
}

function downloadJsonFile(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  window.URL.revokeObjectURL(url);
}

export default function SettingsPanel({ appSettings, onThemeModeChange }) {
  const audioSupport = useMemo(() => getAudioRecordingSupportDetails(), []);
  const { isTestingMicrophone, microphoneLevel, microphoneTestMessage, startMicrophoneTest, stopMicrophoneTest } = useMicrophoneTest();

  const importInputRef = useRef(null);
  const reloadTimeoutRef = useRef(null);
  const [backupMessage, setBackupMessage] = useState("");
  const [pendingImportBackup, setPendingImportBackup] = useState(null);
  const [pendingImportSummary, setPendingImportSummary] = useState(null);
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

  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
      }
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

  function handleExportProgress() {
    try {
      const backup = createProgressBackup({
        appSettings: loadAppSettings(),
        progress: loadStoredProgress(),
      });

      downloadJsonFile(getProgressBackupFilename(), backup);
      setBackupMessage("Progress backup exported. Recordings are not included yet.");
    } catch {
      setBackupMessage("Progress backup could not be exported.");
    }
  }

  function handleChooseImportFile() {
    setBackupMessage("");
    importInputRef.current?.click();
  }

  async function handleImportFileChange(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    try {
      const fileText = await file.text();
      const parsedBackup = parseProgressBackup(fileText);
      const summary = getProgressBackupSummary(parsedBackup);

      setPendingImportBackup(parsedBackup);
      setPendingImportSummary(summary);
      setBackupMessage("");
    } catch (error) {
      setPendingImportBackup(null);
      setPendingImportSummary(null);
      setBackupMessage(error instanceof Error ? error.message : "Progress backup could not be imported.");
    }
  }

  function handleCancelImport() {
    setPendingImportBackup(null);
    setPendingImportSummary(null);
  }

  function handleConfirmImport() {
    if (!pendingImportBackup) return;

    try {
      applyProgressBackup(pendingImportBackup);
      setPendingImportBackup(null);
      setPendingImportSummary(null);
      setBackupMessage("Progress imported. Reloading Guitar Journey...");

      reloadTimeoutRef.current = window.setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "Progress backup could not be imported.");
    }
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
            description="Local progress is currently stored on this device. Export a backup before clearing browser data or moving to another browser."
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

            <div className="settings-action-panel settings-backup-panel">
              <div>
                <strong>Progress backup</strong>
                <p>Export or import custom songs, custom genres, mastered songs, completed steps, session history, and settings. Audio recordings are not included yet.</p>
              </div>

              <div className="settings-backup-actions">
                <button type="button" className="ghost-button" onClick={handleChooseImportFile}>
                  Import Progress
                </button>

                <button type="button" className="selected-button" onClick={handleExportProgress}>
                  Export Progress
                </button>
              </div>

              <input ref={importInputRef} type="file" accept="application/json,.json" className="settings-file-input" onChange={handleImportFileChange} />

              {backupMessage ? <p className="settings-backup-message">{backupMessage}</p> : null}
            </div>
          </SettingsSection>

          <SettingsSection title="Audio" eyebrow="Input / Output" description="Review recording support, test microphone access, and confirm where practice recordings are stored.">
            <div className="settings-status-grid">
              <StatusCard label="Recording support" value={audioSupport.isSupported ? "Supported" : "Unavailable"} tone={audioSupport.isSupported ? "success" : "danger"} />
              <StatusCard label="Detected format" value={audioSupport.supportedMimeTypeLabel} />
              <StatusCard label="Local recordings" value={recordingStorageSummary.label} tone={recordingStorageSummary.count > 0 ? "success" : "neutral"} />
            </div>

            <div className="settings-audio-options-panel" aria-label="Audio input settings">
              <div className="settings-audio-options-copy">
                <div>
                  <strong>Audio settings</strong>
                  <p>
                    Standard mode is tuned for normal practice recording. Advanced/raw input mode is planned for chord recognition experiments, but the current defaults stay safer
                    for everyday recording.
                  </p>
                </div>

                <span>Informational</span>
              </div>

              <div className="settings-audio-setting-grid">
                {AUDIO_SETTING_ROWS.map((setting) => (
                  <AudioSettingCard key={setting.label} {...setting} />
                ))}
              </div>
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

      <ConfirmDialog
        isOpen={Boolean(pendingImportBackup)}
        title="Import progress backup?"
        message={
          pendingImportSummary
            ? `This will replace the current local progress with: ${pendingImportSummary.label}. Practice recordings are not included in this import.`
            : "This will replace the current local progress on this device."
        }
        confirmLabel="Import Progress"
        cancelLabel="Cancel"
        tone="primary"
        onCancel={handleCancelImport}
        onConfirm={handleConfirmImport}
      />
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

function AudioSettingCard({ description, label, status, value }) {
  return (
    <div className="settings-audio-setting-card">
      <div className="settings-audio-setting-header">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <p>{description}</p>
      <small>{status}</small>
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
