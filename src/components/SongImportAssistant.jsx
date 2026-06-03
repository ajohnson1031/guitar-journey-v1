import * as React from "react";
import { createPortal } from "react-dom";
import { analyzeSongText } from "../utils/songImportUtils";
import { ClipboardPasteIcon, CopyIcon, TrashIcon, XIcon } from "./AppIcons";

const { useEffect, useMemo, useState } = React;

const PRACTICE_SETUP_SAMPLE = `Title: Greensleeves
Artist: Traditional
Instrument / Type: Chords
Genre: Folk
Difficulty: Intermediate
Key: Em
Tuning: Standard
Capo: None
BPM: 86

Chords:
Em, G, D, Bm, C, Am, B7

Verse:
Em - G - D - Bm
C - Am - B7 - Em
Em - G - D - Bm
C - B7 - Em - Em

Refrain:
G - D - Bm - Em
C - Am - B7 - B7
G - D - Bm - Em
C - B7 - Em - Em

Practice Goal:
Practice the minor-key chord movement slowly, then loop the Verse and Refrain until the transitions feel smooth.`;

function formatConfidence(value) {
  if (!value) return "";

  return `${value[0].toUpperCase()}${value.slice(1)} confidence`;
}

function getAnalysisMetadataRows(analysis) {
  if (!analysis) return [];

  return [
    ["Title", analysis.title],
    ["Artist", analysis.artist],
    ["Instrument", analysis.instrument],
    ["Genre", analysis.genre],
    ["BPM", analysis.bpm],
    ["Difficulty", analysis.difficulty],
    ["Key", analysis.key],
    ["Tuning", analysis.tuning],
    ["Capo", analysis.capo],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim());
}

function formatFieldList(fields = []) {
  const cleanedFields = fields.filter(Boolean);

  if (!cleanedFields.length) return "";

  if (cleanedFields.length === 1) return cleanedFields[0];

  return `${cleanedFields.slice(0, -1).join(", ")} and ${cleanedFields[cleanedFields.length - 1]}`;
}

function getDefaultAppliedFields(analysis) {
  if (!analysis) return [];

  return [
    analysis.title ? "title" : "",
    analysis.artist ? "artist" : "",
    analysis.instrument ? "instrument" : "",
    analysis.genre ? "genre" : "",
    analysis.bpm ? "BPM" : "",
    analysis.difficulty ? "difficulty" : "",
    analysis.key ? "key" : "",
    analysis.tuning ? "tuning" : "",
    analysis.capo ? "capo" : "",
    analysis.chords?.length ? "chords" : "",
    analysis.transitions?.length ? "transitions" : "",
    analysis.sections?.length ? "sections" : "",
    analysis.goal ? "practice goal" : "",
  ].filter(Boolean);
}

function createApplyMessage(analysis, applyResult = {}) {
  const appliedFields = applyResult.appliedFields?.length ? applyResult.appliedFields : getDefaultAppliedFields(analysis);
  const skippedFields = applyResult.skippedFields || [];
  const appliedMessage = appliedFields.length ? `Applied: ${formatFieldList(appliedFields)}.` : "Analysis applied.";
  const skippedMessage = skippedFields.length ? ` Not applied: ${formatFieldList(skippedFields)}. Add a matching genre first if you want that field applied.` : "";

  return `${appliedMessage}${skippedMessage} Review and edit anything before saving.`;
}

export default function SongImportAssistant({ onApplyAnalysis }) {
  const [songText, setSongText] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [sampleCopyMessage, setSampleCopyMessage] = useState("");

  const previewChords = useMemo(() => analysis?.chords?.slice(0, 12) || [], [analysis]);
  const previewTransitions = useMemo(() => analysis?.transitions?.slice(0, 6) || [], [analysis]);
  const metadataRows = useMemo(() => getAnalysisMetadataRows(analysis), [analysis]);
  const hasSongText = Boolean(songText.trim());
  const canApplyAnalysis = hasSongText && Boolean(analysis?.chords?.length);

  useEffect(() => {
    if (!isInfoDialogOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsInfoDialogOpen(false);
        setSampleCopyMessage("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInfoDialogOpen]);

  function handleAnalyzeSongText() {
    const nextAnalysis = analyzeSongText(songText);

    if (!nextAnalysis.chords.length) {
      setAnalysis(null);
      setMessage("Paste song details before analyzing.");
      return;
    }

    setAnalysis(nextAnalysis);
    const metadataCount = [nextAnalysis.title, nextAnalysis.artist, nextAnalysis.instrument, nextAnalysis.genre, nextAnalysis.bpm].filter(Boolean).length;

    setMessage(
      `Found ${nextAnalysis.chords.length} chord${nextAnalysis.chords.length === 1 ? "" : "s"}, ${
        nextAnalysis.transitions.length
      } transition${nextAnalysis.transitions.length === 1 ? "" : "s"}, ${
        nextAnalysis.sections.length
      } section${nextAnalysis.sections.length === 1 ? "" : "s"}, and ${
        metadataCount
      } detail${metadataCount === 1 ? "" : "s"}. Review before saving.`,
    );
  }

  function handleApplyAnalysis() {
    if (!analysis?.chords?.length) {
      setMessage("Analyze song details before applying.");
      return;
    }

    const applyResult = onApplyAnalysis(analysis) || {};

    setMessage(createApplyMessage(analysis, applyResult));
  }

  function handleClearText() {
    setSongText("");
    setAnalysis(null);
    setMessage("");
  }

  async function handleCopySample() {
    setSampleCopyMessage("");

    try {
      await navigator.clipboard.writeText(PRACTICE_SETUP_SAMPLE);
      setSampleCopyMessage("Sample copied.");
    } catch {
      setSampleCopyMessage("Copy failed. Select the sample text and copy it manually.");
    }
  }

  function handleUseSample() {
    setSongText(PRACTICE_SETUP_SAMPLE);
    setAnalysis(null);
    setMessage("");
    setIsInfoDialogOpen(false);
    setSampleCopyMessage("");
  }

  function handleCloseInfoDialog() {
    setIsInfoDialogOpen(false);
    setSampleCopyMessage("");
  }

  return (
    <div className="import-link-card">
      <div className="practice-setup-assistant-header">
        <label>
          <span>Practice Setup Assistant</span>
          <p className="practice-setup-helper">Paste the details you already know, then use the assistant to organize the song into practice-ready sections.</p>
        </label>

        <button
          type="button"
          className="practice-setup-info-button"
          title="How to use Practice Setup Assistant"
          aria-label="How to use Practice Setup Assistant"
          onClick={() => setIsInfoDialogOpen(true)}
        >
          <span className="practice-setup-info-glyph" aria-hidden="true">i</span>
        </button>
      </div>

      <textarea
        value={songText}
        rows="7"
        aria-label="Practice setup song details"
        placeholder={"Paste song details here...\n\nExample:\nTuning: E A D G B E\nKey: G\nCapo: No capo\n\nVerse\nG  C  Em  D\nChorus\nC  G  D  Em"}
        onChange={(event) => {
          const nextValue = event.target.value;

          setSongText(nextValue);
          setMessage("");

          if (!nextValue.trim()) {
            setAnalysis(null);
          }
        }}
      />

      <div className="custom-song-action-row">
        {message ? <p className="custom-song-action-message">{message}</p> : <span className="custom-song-action-message is-empty" aria-hidden="true" />}

        <div className="custom-song-button-group">
          <button type="button" className="primary-outline-button analyze-paste-button" onClick={handleAnalyzeSongText} disabled={!hasSongText}>
            Analyze Paste
          </button>

          <button type="button" className="selected-button" onClick={handleApplyAnalysis} disabled={!canApplyAnalysis}>
            Apply Analysis
          </button>

          <button
            type="button"
            className="destructive-outline-button clear-paste-button"
            title="Clear Paste"
            aria-label="Clear Paste"
            onClick={handleClearText}
            disabled={!hasSongText}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {analysis ? (
        <div className="custom-song-preview">
          <span>Analysis Preview</span>

          <section className="analysis-preview-section analysis-preview-section--metadata" aria-label="Detected setup details">
            <h3>Detected details</h3>

            {metadataRows.length ? (
              <dl className="analysis-metadata-grid">
                {metadataRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>No setup metadata detected yet.</p>
            )}

            {analysis.key ? (
              <p className="analysis-preview-note">
                Key source: <strong>{analysis.keySource === "metadata" ? "pasted details" : formatConfidence(analysis.keyConfidence)}</strong>
              </p>
            ) : null}
          </section>

          <section className="analysis-preview-section" aria-label="Detected chords">
            <h3>Chords</h3>

            <div className="analysis-chip-row">
              {previewChords.map((chord) => (
                <strong key={chord}>{chord}</strong>
              ))}
            </div>
          </section>

          <section className="analysis-preview-section" aria-label="Suggested song sections">
            <h3>Sections</h3>

            {analysis.sections.length ? (
              <ul className="analysis-preview-list">
                {analysis.sections.map((section) => (
                  <li key={`${section.name}-${section.progression}`}>
                    <strong>{section.name}</strong>
                    <span>{section.progression}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Main section only.</p>
            )}
          </section>

          <section className="analysis-preview-section" aria-label="Suggested transitions">
            <h3>Transitions</h3>

            {previewTransitions.length ? (
              <p>{previewTransitions.join(", ")}</p>
            ) : (
              <p>Not enough movement detected.</p>
            )}
          </section>

          <section className="analysis-preview-section analysis-preview-section--review" aria-label="Review reminder">
            <p>
              Estimated difficulty: <strong>{analysis.difficulty}</strong>{" "}
              <small>{formatConfidence(analysis.difficultyConfidence)}</small>
            </p>

            <p>
              <small>These are suggestions. Review and edit anything before saving.</small>
            </p>
          </section>
        </div>
      ) : null}

      <PracticeSetupInfoDialog
        isOpen={isInfoDialogOpen}
        copyMessage={sampleCopyMessage}
        onClose={handleCloseInfoDialog}
        onCopySample={handleCopySample}
        onUseSample={handleUseSample}
      />
    </div>
  );
}

function PracticeSetupInfoDialog({ copyMessage, isOpen, onClose, onCopySample, onUseSample }) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="practice-setup-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="practice-setup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-setup-dialog-title"
        aria-describedby="practice-setup-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="practice-setup-dialog-header">
          <div>
            <p className="eyebrow">Practice Setup</p>
            <h2 id="practice-setup-dialog-title">How to use the assistant</h2>
          </div>

          <button type="button" className="practice-setup-dialog-close-button" title="Close" aria-label="Close" onClick={onClose}>
            <XIcon />
          </button>
        </header>

        <div className="practice-setup-dialog-body">
          <p id="practice-setup-dialog-description">
            Paste the song details you already know. The assistant looks for chords, likely transitions, section names, key, tuning, capo, and an estimated difficulty. It does not fetch from outside sources or import copyrighted material.
          </p>

          <ul>
            <li>Use it to turn rough notes into editable practice fields.</li>
            <li>Review every suggestion before saving.</li>
            <li>Use the traditional Greensleeves sample below to see multiple sections in the expected format.</li>
          </ul>

          <label className="practice-setup-sample-field">
            <span>Copy/paste sample</span>
            <textarea readOnly value={PRACTICE_SETUP_SAMPLE} rows="13" />
          </label>

          {copyMessage ? <p className="practice-setup-copy-message">{copyMessage}</p> : null}
        </div>

        <footer className="practice-setup-dialog-actions">
          <button type="button" className="practice-setup-dialog-icon-action practice-setup-dialog-copy-button" title="Copy Sample" aria-label="Copy Sample" onClick={onCopySample}>
            <CopyIcon />
          </button>

          <button type="button" className="practice-setup-dialog-icon-action practice-setup-dialog-use-button" title="Use Sample" aria-label="Use Sample" onClick={onUseSample}>
            <ClipboardPasteIcon />
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
