import * as React from "react";
import { DEFAULT_FORM, DOWN_STRUM, KEY_OPTIONS, UP_STRUM } from "../constants";
const { useMemo, useEffect, useState } = React;

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((word) => {
      if (!word) return word;

      return `${word[0].toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSections(value) {
  const sections = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameRaw, ...progressionParts] = line.split(":");
      const name = nameRaw?.trim() || "Section";
      const progression = progressionParts.join(":").trim();

      return {
        name,
        progression: progression || line,
      };
    });

  if (sections.length) return sections;

  return [{ name: "Main", progression: "X - X - X - X" }];
}

function sectionsToText(sections) {
  if (!Array.isArray(sections) || !sections.length) {
    return DEFAULT_FORM.sections;
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
  if (!song) return DEFAULT_FORM;

  return {
    sourceUrl: song.sourceUrl || "",
    artist: song.artist || "",
    instrument: song.instrument || "",
    title: song.title || "",
    genre: song.genre || "",
    key: song.key || "",
    bpm: String(song.bpm || "72"),
    difficulty: song.difficulty || "",
    chords: Array.isArray(song.chords) ? song.chords.join(", ") : "",
    transitions: Array.isArray(song.transitions) ? song.transitions.join(", ") : "",
    sections: sectionsToText(song.sections),
    strummingPattern: parseStrummingPattern(song.strumming),
    goal: song.goal || DEFAULT_FORM.goal,
  };
}

function parseUltimateGuitarUrl(value) {
  try {
    const url = new URL(value.trim());

    const isUltimateGuitar = url.hostname === "tabs.ultimate-guitar.com" || url.hostname === "www.ultimate-guitar.com" || url.hostname === "ultimate-guitar.com";

    if (!isUltimateGuitar) {
      return {
        ok: false,
        message: "That does not look like an Ultimate Guitar link.",
      };
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const tabIndex = pathParts.indexOf("tab");

    if (tabIndex === -1) {
      return {
        ok: false,
        message: "Could not find a tab path in that Ultimate Guitar link.",
      };
    }

    const artistSlug = pathParts[tabIndex + 1] || "";
    const songSlug = pathParts[tabIndex + 2] || "";

    if (!artistSlug || !songSlug) {
      return {
        ok: false,
        message: "Could not read artist and song information from that link.",
      };
    }

    const tabIdMatch = songSlug.match(/-(\d+)$/);
    const tabId = tabIdMatch?.[1] || "";

    const songSlugWithoutId = tabId ? songSlug.replace(`-${tabId}`, "") : songSlug;
    const knownTypes = ["chords", "tab", "tabs", "bass", "ukulele", "drums", "guitar-pro"];
    const songParts = songSlugWithoutId.split("-").filter(Boolean);

    let instrument = "Guitar";
    let titleParts = songParts;

    const lastPart = songParts[songParts.length - 1];

    if (knownTypes.includes(lastPart)) {
      instrument = lastPart === "guitar-pro" ? "Guitar Pro" : titleCase(lastPart);
      titleParts = songParts.slice(0, -1);
    }

    const artist = titleCase(artistSlug);
    const title = titleCase(titleParts.join("-"));

    return {
      ok: true,
      data: {
        artist,
        title,
        instrument,
        tabId,
        source: "Ultimate Guitar",
        sourceUrl: url.toString(),
      },
    };
  } catch {
    return {
      ok: false,
      message: "Enter a valid Ultimate Guitar URL.",
    };
  }
}

function sanitizeTransitionValue(value) {
  return String(value || "")
    .replace(/[^a-zA-Z,\s→]/g, "")
    .replace(/\s{2,}/g, " ");
}

function formatTransitionValue(value) {
  return sanitizeTransitionValue(value)
    .replace(/\s*→\s*/g, " → ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getNextTransitionValue(currentValue, addition) {
  const value = String(currentValue || "");

  if (addition === "arrow") {
    const trimmed = value.trimEnd();

    if (!trimmed) return value;
    if (trimmed.endsWith("→")) return `${trimmed} `;
    if (trimmed.endsWith(",")) return `${trimmed} `;

    return `${trimmed} → `;
  }

  if (addition === "comma") {
    const trimmed = value.trimEnd();

    if (!trimmed) return value;
    if (trimmed.endsWith(",")) return `${trimmed} `;
    if (trimmed.endsWith("→")) return trimmed;

    return `${trimmed}, `;
  }

  return value;
}

export default function CustomSongForm({ editingSong, genres, onAddSong, onCancelEdit, onUpdateSong }) {
  const isEditing = Boolean(editingSong);

  const [form, setForm] = useState(DEFAULT_FORM);
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
    setForm(isEditing ? songToForm(editingSong) : DEFAULT_FORM);
    setMessage("");
  }

  function closeForm() {
    setIsOpen(false);
    setMessage("");
    setForm(DEFAULT_FORM);

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
        current.goal === DEFAULT_FORM.goal
          ? `Learn ${titleWithArtist} with clean timing, smooth transitions, and a focused ${imported.instrument.toLowerCase()} practice plan.`
          : current.goal,
    }));

    setInfoMessage("Imported starter details. Review and fill in genre, key, difficulty, chords, sections, and strumming.");
  }

  function addStrum(direction) {
    setForm((current) => ({
      ...current,
      strummingPattern: [...current.strummingPattern, direction],
    }));
    setMessage("");
  }

  function undoLastStrum() {
    setForm((current) => ({
      ...current,
      strummingPattern: current.strummingPattern.slice(0, -1),
    }));
    setMessage("");
  }

  function clearStrummingPattern() {
    setForm((current) => ({
      ...current,
      strummingPattern: [],
    }));
    setMessage("");
  }

  function handleTransitionKeyDown(event) {
    const allowedControlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Tab"];

    if (allowedControlKeys.includes(event.key) || event.metaKey || event.ctrlKey) {
      return;
    }

    if (/^[a-zA-Z]$/.test(event.key)) {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      updateField("transitions", getNextTransitionValue(form.transitions, "arrow"));
      return;
    }

    if (event.key === ",") {
      event.preventDefault();
      updateField("transitions", getNextTransitionValue(form.transitions, "comma"));
      return;
    }

    event.preventDefault();
  }

  function handleTransitionChange(event) {
    updateField("transitions", sanitizeTransitionValue(event.target.value));
  }

  function handleTransitionBlur(event) {
    updateField("transitions", formatTransitionValue(event.target.value));
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
    setForm(DEFAULT_FORM);
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
              <span>BPM</span>
              <input type="number" min="40" max="220" value={form.bpm} onChange={(event) => updateField("bpm", event.target.value)} />
            </label>

            <label>
              <span>Difficulty</span>
              <select value={form.difficulty} onChange={(event) => updateField("difficulty", event.target.value)}>
                <option value="">Select difficulty...</option>
                {["Beginner", "Intermediate", "Advanced", "Expert"].map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="strumming-builder">
            <div>
              <span>Strumming Pattern</span>
              <p>Tap down/up arrows to build the rhythm sequence.</p>
            </div>

            <div className="strumming-display" aria-label="Selected strumming pattern">
              {form.strummingPattern.length ? (
                form.strummingPattern.map((direction, index) => (
                  <strong key={`${direction}-${index}`} className={direction === DOWN_STRUM ? "strum-down" : "strum-up"}>
                    {direction}
                  </strong>
                ))
              ) : (
                <small>No strumming pattern yet</small>
              )}
            </div>

            <div className="strumming-actions">
              <button type="button" className="strum-arrow-button strum-down-button" onClick={() => addStrum(DOWN_STRUM)} aria-label="Add down strum">
                {DOWN_STRUM}
              </button>

              <button type="button" className="strum-arrow-button strum-up-button" onClick={() => addStrum(UP_STRUM)} aria-label="Add up strum">
                {UP_STRUM}
              </button>

              <button type="button" className="ghost-button" onClick={undoLastStrum}>
                Undo
              </button>

              <button type="button" className="danger-button" onClick={clearStrummingPattern}>
                Clear
              </button>
            </div>
          </div>

          <label>
            <span>Chords</span>
            <input type="text" value={form.chords} placeholder="G, C, Em, D" onChange={(event) => updateField("chords", event.target.value)} />
          </label>

          <label>
            <span>Transitions</span>
            <input
              type="text"
              value={form.transitions}
              placeholder="e.g., G → C, C → G, G → D, Em → C"
              onKeyDown={handleTransitionKeyDown}
              onChange={handleTransitionChange}
              onBlur={handleTransitionBlur}
            />
          </label>

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
