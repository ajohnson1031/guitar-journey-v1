import * as React from "react";
import { analyzeSongText } from "../utils/songImportUtils";

const { useMemo, useState } = React;

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
      } transition${nextAnalysis.transitions.length === 1 ? "" : "s"}, and ${nextAnalysis.sections.length} section${nextAnalysis.sections.length === 1 ? "" : "s"}.`,
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
          placeholder={"Paste chord text here...\n\nExample:\nVerse\nG  C  Em  D\nChorus\nC  G  D  Em"}
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
              Suggested key: <strong>{analysis.key}</strong>
            </p>
          ) : null}

          {previewTransitions.length ? (
            <p>
              Suggested transitions: <strong>{previewTransitions.join(", ")}</strong>
            </p>
          ) : null}

          {analysis.sections.length ? (
            <p>
              Suggested sections: <strong>{analysis.sections.map((section) => section.name).join(", ")}</strong>
            </p>
          ) : null}

          <p>
            Estimated difficulty: <strong>{analysis.difficulty}</strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}
