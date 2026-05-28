import * as React from "react";
import { DEFAULT_CUSTOM_SONG_FORM, DOWN_STRUM, KEY_OPTIONS, UP_STRUM } from "../constants";
import { parseCommaList, parseSections, parseUltimateGuitarUrl, slugify } from "../utils/songFormUtils";
import { StrummingPatternBuilder, TransitionInput } from "./";
const { useMemo, useEffect, useState } = React;

const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];

function sectionsToText(sections) {
  if (!Array.isArray(sections) || !sections.length) {
    return DEFAULT_CUSTOM_SONG_FORM.sections;
  }

  return sections.map((section) => `${section.name || "Section"}: ${section.progression || "X - X - X - X"}`).join("\n");
}

function parseStrummingPattern(value) {
  const text = String(value || "").trim();

  if (!text) return [];

  if (!/^[↓↑\s]+$/.test(text)) {
    return [];
  }

  return text.split(/\s+/).filter((direction) => direction === DOWN_STRUM || direction === UP_STRUM);
}

function songToForm(song) {
  if (!song) return DEFAULT_CUSTOM_SONG_FORM;

  return {
    sourceUrl: song.sourceUrl || "",
    artist: song.artist || "",
    instrument: song.instrument || "",
    title: song.title || "",
    genre: song.genre || "",
    key: song.key || "",
    tuning: song.tuning || "",
    capo: song.capo || "",
    bpm: String(song.bpm || "72"),
    difficulty: song.difficulty || "",
    chords: Array.isArray(song.chords) ? song.chords.join(", ") : "",
    transitions: Array.isArray(song.transitions) ? song.transitions.join(", ") : "",
    sections: sectionsToText(song.sections),
    strummingPattern: parseStrummingPattern(song.strumming),
    goal: song.goal || DEFAULT_CUSTOM_SONG_FORM.goal,
  };
}

export default function CustomSongForm({ editingSong, genres, onAddSong, onCancelEdit, onUpdateSong }) {
  const isEditing = Boolean(editingSong);

  const [form, setForm] = useState(DEFAULT_CUSTOM_SONG_FORM);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("error");

  const previewChords = useMemo(() => parseCommaList(form.chords), [form.chords]);
  const strummingPatternText = form.strummingPattern.join(" ");

  useEffect(() => {
    if (!editingSong) return;

    setForm(songToForm(editingSong));
    setIsOpen(true);
    setMessage("");
  }, [editingSong]);

  function setValidationMessage(value) {
    setMessage(value);
    setMessageTone("error");
  }

  function setInfoMessage(value) {
    setMessage(value);
    setMessageTone("info");
  }

  function updateField(fieldName, value) {
    setForm((current) => ({
      ...current,
      [fieldName]: value,
    }));
    setMessage("");
  }

  function resetForm() {
    setForm(isEditing ? songToForm(editingSong) : DEFAULT_CUSTOM_SONG_FORM);
    setMessage("");
  }

  function closeForm() {
    setIsOpen(false);
    setMessage("");
    setForm(DEFAULT_CUSTOM_SONG_FORM);

    if (isEditing) {
      onCancelEdit();
    }
  }

  function importFromUltimateGuitarLink() {
    const result = parseUltimateGuitarUrl(form.sourceUrl);

    if (!result.ok) {
      setValidationMessage(result.message);
      return;
    }

    const imported = result.data;
    const titleWithArtist = imported.artist ? `${imported.title} — ${imported.artist}` : imported.title;

    setForm((current) => ({
      ...current,
      title: imported.title || current.title,
      artist: imported.artist || current.artist,
      instrument: imported.instrument || current.instrument,
      sourceUrl: imported.sourceUrl || current.sourceUrl,
      goal:
        current.goal === DEFAULT_CUSTOM_SONG_FORM.goal
          ? `Learn ${titleWithArtist} with clean timing, smooth transitions, and a focused ${imported.instrument.toLowerCase()} practice plan.`
          : current.goal,
    }));

    setInfoMessage("Imported starter details. Review and fill in genre, key, difficulty, chords, sections, and strumming.");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setValidationMessage("Add a song title before saving.");
      return;
    }

    if (!form.genre) {
      setValidationMessage("Select a genre before saving.");
      return;
    }

    if (!form.key) {
      setValidationMessage("Select a key before saving.");
      return;
    }

    if (!form.difficulty) {
      setValidationMessage("Select a difficulty before saving.");
      return;
    }

    if (!form.strummingPattern.length) {
      setValidationMessage("Add at least one down or up strum to the strumming pattern.");
      return;
    }

    const chords = parseCommaList(form.chords);

    if (!chords.length) {
      setValidationMessage("Add at least one chord.");
      return;
    }

    const bpm = Number(form.bpm);

    const song = {
      id: editingSong?.id || `custom-${slugify(title)}-${Date.now()}`,
      title,
      artist: form.artist.trim(),
      instrument: form.instrument.trim(),
      genre: form.genre,
      key: form.key,
      tuning: form.tuning.trim(),
      capo: form.capo.trim(),
      bpm: Number.isFinite(bpm) ? bpm : 80,
      difficulty: form.difficulty,
      chords,
      transitions: parseCommaList(form.transitions),
      sections: parseSections(form.sections),
      strumming: strummingPatternText,
      goal: form.goal.trim() || "Practice this song with clean timing and smooth transitions.",
      source: form.sourceUrl.trim() ? "Ultimate Guitar" : "",
      sourceUrl: form.sourceUrl.trim(),
      isCustom: true,
      createdAt: editingSong?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      onUpdateSong(song);
    } else {
      onAddSong(song);
    }

    setMessage("");
    setMessageTone("error");
    setForm(DEFAULT_CUSTOM_SONG_FORM);
    setIsOpen(false);
  }

  return (
    <section className="panel-card custom-song-card">
      <div className="custom-song-header">
        <div>
          <h2>{isEditing ? "Edit Custom Song" : "Add Custom Song"}</h2>
          <p className="section-copy">
            {isEditing
              ? "Update this song’s study details, rhythm, sections, and practice goal."
              : "Create a personal study song with chords, sections, rhythm, and a practice goal."}
          </p>
        </div>

        <button
          type="button"
          className={isOpen ? "selected-button" : "ghost-button"}
          onClick={() => {
            if (isOpen) {
              closeForm();
              return;
            }

            setIsOpen(true);
            setMessage("");
          }}
        >
          {isOpen ? "Close" : "Add Song"}
        </button>
      </div>

      {isOpen ? (
        <form className="custom-song-form" onSubmit={handleSubmit}>
          <div className="import-link-card">
            <label>
              <span>Import from Ultimate Guitar link</span>
              <input
                type="url"
                value={form.sourceUrl}
                placeholder="https://tabs.ultimate-guitar.com/tab/artist/song-chords-123456"
                onChange={(event) => updateField("sourceUrl", event.target.value)}
              />
            </label>

            <button type="button" className="ghost-button" onClick={importFromUltimateGuitarLink}>
              Import Starter Details
            </button>

            <p>This reads artist, title, instrument/type, tab ID, and source URL from the link. Chords and sections stay editable so you can build your own study plan.</p>
          </div>

          <div className="form-grid two">
            <label>
              <span>Song Title</span>
              <input type="text" value={form.title} placeholder="Example: I Want You Around" onChange={(event) => updateField("title", event.target.value)} />
            </label>

            <label>
              <span>Artist</span>
              <input type="text" value={form.artist} placeholder="Example: Snoh Aalegra" onChange={(event) => updateField("artist", event.target.value)} />
            </label>

            <label>
              <span>Instrument / Type</span>
              <input type="text" value={form.instrument} placeholder="Example: Bass, Chords, Tab" onChange={(event) => updateField("instrument", event.target.value)} />
            </label>

            <label>
              <span>Genre</span>
              <select value={form.genre} onChange={(event) => updateField("genre", event.target.value)}>
                <option value="">Select a genre...</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Difficulty</span>
              <select value={form.difficulty} onChange={(event) => updateField("difficulty", event.target.value)}>
                <option value="">Select difficulty...</option>
                {DIFFICULTY_OPTIONS.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Key</span>
              <select value={form.key} onChange={(event) => updateField("key", event.target.value)}>
                <option value="">Select a key...</option>
                {KEY_OPTIONS.map((keyOption) => (
                  <option key={keyOption} value={keyOption}>
                    {keyOption}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Tuning</span>
              <input type="text" value={form.tuning} placeholder="e.g., Standard, Eb Standard, Drop D" onChange={(event) => updateField("tuning", event.target.value)} />
            </label>

            <label>
              <span>BPM</span>
              <input type="number" min="40" max="220" value={form.bpm} onChange={(event) => updateField("bpm", event.target.value)} />
            </label>

            <label>
              <span>Capo</span>
              <input type="text" value={form.capo} placeholder="e.g., None, 1st fret, 3rd fret" onChange={(event) => updateField("capo", event.target.value)} />
            </label>
          </div>

          <StrummingPatternBuilder
            value={form.strummingPattern}
            onChange={(nextPattern) => {
              setForm((current) => ({
                ...current,
                strummingPattern: nextPattern,
              }));
              setMessage("");
            }}
          />

          <label>
            <span>Chords</span>
            <input type="text" value={form.chords} placeholder="G, C, Em, D" onChange={(event) => updateField("chords", event.target.value)} />
          </label>

          <TransitionInput value={form.transitions} onChange={(nextTransitions) => updateField("transitions", nextTransitions)} />

          <label>
            <span>Song Sections</span>
            <textarea
              value={form.sections}
              rows="4"
              placeholder={"Verse: X - X - X - X\nChorus: X - X - X - X"}
              onChange={(event) => updateField("sections", event.target.value)}
            />
          </label>

          <label>
            <span>Practice Goal</span>
            <textarea value={form.goal} rows="3" onChange={(event) => updateField("goal", event.target.value)} />
          </label>

          <div className="custom-song-preview">
            <span>Preview chords</span>
            <div>{previewChords.length ? previewChords.map((chord) => <strong key={chord}>{chord}</strong>) : <small>No chords yet</small>}</div>
          </div>

          <div className="custom-song-actions">
            <p className={`custom-song-message ${messageTone === "error" ? "is-error" : "is-info"}`} aria-live="polite">
              {message}
            </p>

            <div className="custom-song-button-group">
              {isEditing ? (
                <button type="button" className="ghost-button" onClick={closeForm}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" className="ghost-button" onClick={resetForm}>
                  Reset Form
                </button>
              )}

              <button type="submit" className="complete-session-button">
                {isEditing ? "Save Updated Song" : "Save Custom Song"}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
