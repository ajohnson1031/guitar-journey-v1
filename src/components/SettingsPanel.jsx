import * as React from "react";
import { useMicrophoneTest } from "../hooks";
import { getAudioRecordingSupportDetails } from "../utils/audioRecordingUtils";
import { getLevelBarStates, getLevelMeterTone } from "../utils/microphoneTestUtils";
import { applyProgressBackupWithRecordings, createProgressBackupWithRecordings, getProgressBackupSummary, parseProgressBackup } from "../utils/progressBackupUtils";
import { getRecordingStorageSummary } from "../utils/recordingStorageUtils";
import {
  AUDIO_INPUT_MODE_ADVANCED,
  AUDIO_INPUT_MODE_OPTIONS,
  createAudioInputSettings,
  getResolvedAudioInputSettings,
  loadAppSettings,
  THEME_MODE_OPTIONS,
} from "../utils/settingsStorageUtils";
import { loadStoredProgress } from "../utils/storageUtils";
import { DownloadIcon, MicIcon, MicOffIcon, UploadIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useEffect, useMemo, useRef, useState } = React;

const BACKUP_MESSAGE_TIMEOUT_MS = 5000;
const IMPORT_SUCCESS_FLASH_KEY = "guitar-journey:import-success-flash";

const AUDIO_PROCESSING_SETTINGS = [
  {
    key: "echoCancellation",
    label: "Echo cancellation",
    description: "Helps reduce speaker feedback during recording.",
  },
  {
    key: "noiseSuppression",
    label: "Noise suppression",
    description: "Helps reduce room noise for cleaner practice takes.",
  },
  {
    key: "autoGainControl",
    label: "Auto gain control",
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

function saveImportSuccessFlash(message = "Progress imported successfully.") {
  try {
    window.sessionStorage.setItem(
      IMPORT_SUCCESS_FLASH_KEY,
      JSON.stringify({
        message,
        tone: "success",
      }),
    );
  } catch {
    // Import still succeeds if the browser blocks sessionStorage.
  }
}

function readImportSuccessFlash() {
  try {
    const rawFlash = window.sessionStorage.getItem(IMPORT_SUCCESS_FLASH_KEY);

    if (!rawFlash) return null;

    window.sessionStorage.removeItem(IMPORT_SUCCESS_FLASH_KEY);

    const flash = JSON.parse(rawFlash);

    return {
      message: String(flash.message || "Progress imported successfully."),
      tone: flash.tone === "danger" ? "danger" : "success",
    };
  } catch {
    return null;
  }
}

export default function SettingsPanel({ appSettings, onAudioInputModeChange, onAudioInputSettingChange, onProgressImported = () => {}, onThemeModeChange }) {
  const audioInputSettings = createAudioInputSettings(appSettings.audioInputSettings);
  const resolvedAudioInputSettings = getResolvedAudioInputSettings(audioInputSettings);
  const isAdvancedAudioMode = audioInputSettings.inputMode === AUDIO_INPUT_MODE_ADVANCED;
  const audioSupport = useMemo(() => getAudioRecordingSupportDetails(), []);
  const { isTestingMicrophone, microphoneLevel, microphoneTestMessage, startMicrophoneTest, stopMicrophoneTest } = useMicrophoneTest(audioInputSettings);

  const importInputRef = useRef(null);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupMessageTone, setBackupMessageTone] = useState("success");
  const [pendingImportBackup, setPendingImportBackup] = useState(null);
  const [pendingImportSummary, setPendingImportSummary] = useState(null);
  const [recordingStorageSummary, setRecordingStorageSummary] = useState({
    count: 0,
    isSupported: false,
    label: "Checking...",
  });

  useEffect(() => {
    let isMounted = true;

    getRecordingStorageSummary(loadStoredProgress().sessionHistory)
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
    const importSuccessFlash = readImportSuccessFlash();

    if (importSuccessFlash) {
      showBackupMessage(importSuccessFlash.message, importSuccessFlash.tone);
    }
  }, []);

  useEffect(() => {
    if (!backupMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setBackupMessage("");
    }, BACKUP_MESSAGE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [backupMessage]);

  function showBackupMessage(message, tone = "success") {
    setBackupMessage(message);
    setBackupMessageTone(tone);
  }

  function handleMicrophoneTestClick() {
    if (!audioSupport.isSupported) return;

    if (isTestingMicrophone) {
      void stopMicrophoneTest();
      return;
    }

    void startMicrophoneTest();
  }

  async function handleExportProgress() {
    try {
      const backup = await createProgressBackupWithRecordings({
        appSettings: loadAppSettings(),
        progress: loadStoredProgress(),
      });

      const recordingCount = backup.recordings?.items?.length || 0;

      downloadJsonFile(getProgressBackupFilename(), backup);

      showBackupMessage(
        recordingCount
          ? `Progress backup exported with ${recordingCount} recording${recordingCount === 1 ? "" : "s"}.`
          : "Progress backup exported. No recordings were found to include.",
        "success",
      );
    } catch {
      showBackupMessage("Progress backup could not be exported.", "danger");
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
      showBackupMessage(error instanceof Error ? error.message : "Progress backup could not be imported.", "danger");
    }
  }

  function handleCancelImport() {
    setPendingImportBackup(null);
    setPendingImportSummary(null);
  }

  async function handleConfirmImport() {
    if (!pendingImportBackup) return;

    try {
      const importedBackup = await applyProgressBackupWithRecordings(pendingImportBackup);

      saveImportSuccessFlash(
        importedBackup.restoredRecordingCount
          ? `Progress imported successfully with ${importedBackup.restoredRecordingCount} recording${importedBackup.restoredRecordingCount === 1 ? "" : "s"}.`
          : "Progress imported successfully.",
      );
      setPendingImportBackup(null);
      setPendingImportSummary(null);
      onProgressImported();
    } catch (error) {
      showBackupMessage(error instanceof Error ? error.message : "Progress backup could not be imported.", "danger");
    }
  }

  function handleAudioModeChange(inputMode) {
    onAudioInputModeChange(inputMode);
  }

  function handleAudioSettingToggle(settingKey) {
    if (!isAdvancedAudioMode) return;

    onAudioInputSettingChange(settingKey, !audioInputSettings[settingKey]);
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
                <p>Export or import custom songs, custom genres, mastered songs, completed steps, session history, settings, and local audio recordings.</p>
              </div>

              <div className="settings-backup-actions">
                <button type="button" className="ghost-button" onClick={handleChooseImportFile}>
                  <UploadIcon />
                  <span>Import</span>
                </button>

                <button type="button" className="selected-button" onClick={handleExportProgress}>
                  <DownloadIcon />
                  <span>Export</span>
                </button>
              </div>

              <input ref={importInputRef} type="file" accept="application/json,.json" className="settings-file-input" onChange={handleImportFileChange} />

              {backupMessage ? <p className={`settings-backup-message settings-backup-message--${backupMessageTone}`}>{backupMessage}</p> : null}
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
                    Standard mode is tuned for normal practice recording. Advanced/raw input mode can adjust browser audio processing for testing and chord-recognition experiments.
                  </p>
                </div>

                <span>{isAdvancedAudioMode ? "Advanced" : "Standard"}</span>
              </div>

              <div className="settings-audio-mode-grid" role="group" aria-label="Audio input mode">
                {AUDIO_INPUT_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`settings-option-card settings-audio-mode-card ${audioInputSettings.inputMode === option.id ? "is-selected" : ""}`}
                    onClick={() => handleAudioModeChange(option.id)}
                  >
                    <div className="settings-option-header">
                      <span>{option.label}</span>

                      {audioInputSettings.inputMode === option.id ? <strong className="settings-active-badge">Active</strong> : null}
                    </div>

                    <small>{option.description}</small>
                  </button>
                ))}
              </div>

              <div className="settings-audio-setting-grid">
                {AUDIO_PROCESSING_SETTINGS.map((setting) => (
                  <AudioSettingCard
                    key={setting.key}
                    description={setting.description}
                    isAdvancedAudioMode={isAdvancedAudioMode}
                    isEnabled={Boolean(resolvedAudioInputSettings[setting.key])}
                    label={setting.label}
                    onToggle={() => handleAudioSettingToggle(setting.key)}
                    settingKey={setting.key}
                  />
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
                {isTestingMicrophone ? (
                  <>
                    <MicOffIcon />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <MicIcon />
                    <span>Test</span>
                  </>
                )}
              </button>

              <MicrophoneLevelMeter isActive={isTestingMicrophone} level={microphoneLevel} />
            </div>

            <div className="settings-local-audio-note">
              <strong>Local audio note</strong>
              <p>
                Practice recordings are stored locally in this browser with IndexedDB. They are not synced across devices yet, and they{" "}
                <span className="settings-danger-text">can be removed</span> if browser site data is cleared.
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
            ? `This will replace the current local progress with: ${pendingImportSummary.label}. ${pendingImportSummary.recordingCount ? "Included recordings will be restored locally." : "No recordings are included in this backup."}`
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

function AudioSettingCard({ description, isAdvancedAudioMode, isEnabled, label, onToggle, settingKey }) {
  const valueLabel = isAdvancedAudioMode ? (isEnabled ? "On" : "Off") : "On by default";
  const statusLabel = isAdvancedAudioMode ? "Editable in Advanced" : "Locked in Standard";

  return (
    <div className="settings-audio-setting-card">
      <div className="settings-audio-setting-header">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </div>

      <p>{description}</p>

      <div className="settings-audio-setting-footer">
        <small>{statusLabel}</small>

        <button
          type="button"
          className={`settings-audio-toggle ${isEnabled ? "is-enabled" : ""}`}
          aria-label={`Toggle ${label}`}
          aria-pressed={isEnabled}
          disabled={!isAdvancedAudioMode}
          onClick={onToggle}
          data-setting-key={settingKey}
        >
          {isAdvancedAudioMode ? (isEnabled ? "On" : "Off") : "Locked"}
        </button>
      </div>
    </div>
  );
}

function MicrophoneLevelMeter({ isActive, level }) {
  const meterLevel = isActive ? level : 0;
  const levelBars = getLevelBarStates(meterLevel, 10);
  const tone = getLevelMeterTone(meterLevel, 10);

  return (
    <div className={`microphone-level-meter ${isActive ? "is-active" : ""} is-level-${tone}`} aria-label="Microphone input level" aria-live="polite">
      {levelBars.map((isLevelActive, index) => (
        <span key={index} className={`microphone-level-bar ${isLevelActive ? "is-level-active" : ""}`} />
      ))}
    </div>
  );
}
