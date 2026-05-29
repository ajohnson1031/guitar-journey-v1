import * as React from "react";
import { analyzeSongText } from "../utils/songImportUtils";

const { useMemo, useState } = React;

function formatConfidence(value) {
  if (!value) return "";

  return `${value[0].toUpperCase()}${value.slice(1)} confidence`;
}

export default function SongImportAssistant({ onApplyAnalysis }) {
  const [songText, setSongText] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const previewChords = useMemo(() => analysis?.chords?.slice(0, 12) || [], [analysis]);
  const previewTransitions = useMemo(() => analysis?.transitions?.slice(0, 6) || [], [analysis]);

  function handleAnalyzeSongText() {
    const nextAnalysis = analyzeSongText(songText);

    if (!nextAnalysis.chords.length) {
      setAnalysis(null);
      setMessage("Paste chord text before analyzing.");
      return;
    }

    setAnalysis(nextAnalysis);
    setMessage(
      `Found ${nextAnalysis.chords.length} chord${nextAnalysis.chords.length === 1 ? "" : "s"}, ${
        nextAnalysis.transitions.length
      } transition${nextAnalysis.transitions.length === 1 ? "" : "s"}, and ${
        nextAnalysis.sections.length
      } section${nextAnalysis.sections.length === 1 ? "" : "s"}. Review before saving.`,
    );
  }

  function handleApplyAnalysis() {
    if (!analysis?.chords?.length) {
      setMessage("Analyze song text before applying.");
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

  return (
    <div className="import-link-card">
      <label>
        <span>Song Import Assistant</span>
        <textarea
          value={songText}
          rows="7"
          placeholder={"Paste chord text here...\n\nExample:\nTuning: E A D G B E\nKey: G\nCapo: No capo\n\nVerse\nG  C  Em  D\nChorus\nC  G  D  Em"}
          onChange={(event) => {
            setSongText(event.target.value);
            setMessage("");
          }}
        />
      </label>

      <div className="custom-song-button-group">
        <button type="button" className="ghost-button" onClick={handleClearText}>
          Clear Paste
        </button>

        <button type="button" className="ghost-button" onClick={handleAnalyzeSongText}>
          Analyze Paste
        </button>

        <button type="button" className="selected-button" onClick={handleApplyAnalysis}>
          Apply Analysis
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
              <small>{analysis.keySource === "metadata" ? "Detected from page text" : formatConfidence(analysis.keyConfidence)}</small>
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
    </div>
  );
}
