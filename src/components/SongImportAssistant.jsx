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

export default function SongImportAssistant({ onApplyAnalysis }) {
  const [songText, setSongText] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [sampleCopyMessage, setSampleCopyMessage] = useState("");

  const previewChords = useMemo(() => analysis?.chords?.slice(0, 12) || [], [analysis]);
  const previewTransitions = useMemo(() => analysis?.transitions?.slice(0, 6) || [], [analysis]);
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

    onApplyAnalysis(analysis);
    setMessage("Analysis applied. Review and edit anything before saving.");
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

      {message ? <p>{message}</p> : null}

      {analysis ? (
        <div className="custom-song-preview">
          <span>Analysis Preview</span>

          <div>
            {previewChords.map((chord) => (
              <strong key={chord}>{chord}</strong>
            ))}
          </div>

          {analysis.key ? (
            <p>
              Suggested key: <strong>{analysis.key}</strong>{" "}
              <small>{analysis.keySource === "metadata" ? "Detected from pasted details" : formatConfidence(analysis.keyConfidence)}</small>
            </p>
          ) : (
            <p>
              Suggested key: <strong>Not detected</strong> <small>Select one manually before saving.</small>
            </p>
          )}

          {analysis.tuning ? (
            <p>
              Detected tuning: <strong>{analysis.tuning}</strong>
            </p>
          ) : (
            <p>
              Detected tuning: <strong>Not detected</strong>
            </p>
          )}

          {analysis.capo ? (
            <p>
              Detected capo: <strong>{analysis.capo}</strong>
            </p>
          ) : (
            <p>
              Detected capo: <strong>Not detected</strong>
            </p>
          )}

          {previewTransitions.length ? (
            <p>
              Suggested transitions: <strong>{previewTransitions.join(", ")}</strong>
            </p>
          ) : (
            <p>
              Suggested transitions: <strong>Not enough movement detected</strong>
            </p>
          )}

          {analysis.sections.length ? (
            <p>
              Suggested sections: <strong>{analysis.sections.map((section) => section.name).join(", ")}</strong>
            </p>
          ) : (
            <p>
              Suggested sections: <strong>Main section only</strong>
            </p>
          )}

          <p>
            Estimated difficulty: <strong>{analysis.difficulty}</strong> <small>{formatConfidence(analysis.difficultyConfidence)}</small>
          </p>

          <p>
            <small>These are suggestions. Review and edit anything before saving.</small>
          </p>
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
