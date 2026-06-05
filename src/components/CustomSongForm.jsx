import * as React from "react";
import { DEFAULT_CUSTOM_SONG_FORM, KEY_OPTIONS } from "../constants";
import { parseCommaList, parseSections, slugify } from "../utils/songFormUtils";
import { STRUMMING_PRESETS, createPresetStrummingPattern, hasStrummingPattern, normalizeStrummingPatternData, serializeStrummingPattern } from "../utils/strummingUtils";
import { SongImportAssistant, StrummingPatternBuilder, TransitionInput } from "./";

const { useEffect, useMemo, useState } = React;

const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];

const noop = () => {};

function sectionsToText(sections) {
  if (!Array.isArray(sections) || !sections.length) {
    return DEFAULT_CUSTOM_SONG_FORM.sections;
  }

  return sections.map((section) => `${section.name || "Section"}: ${section.progression || "X - X - X - X"}`).join("\n");
}

function getDefaultForm() {
  return {
    ...DEFAULT_CUSTOM_SONG_FORM,
    strummingPattern: normalizeStrummingPatternData(DEFAULT_CUSTOM_SONG_FORM.strummingPattern),
  };
}

function normalizeGenreValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getMatchingGenre(value, genres = []) {
  const normalizedValue = normalizeGenreValue(value).toLowerCase();

  if (!normalizedValue) return "";

  return genres.find((genre) => normalizeGenreValue(genre).toLowerCase() === normalizedValue) || "";
}

function shouldCreatePendingGenre(value, pendingGenre, genres = []) {
  const normalizedValue = normalizeGenreValue(value);
  const normalizedPendingGenre = normalizeGenreValue(pendingGenre);

  if (!normalizedValue || !normalizedPendingGenre) return false;
  if (normalizedValue.toLowerCase() !== normalizedPendingGenre.toLowerCase()) return false;

  return !getMatchingGenre(normalizedPendingGenre, genres);
}

function getAppliedBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return "";

  return String(Math.min(220, Math.max(40, Math.round(bpm))));
}

function normalizeSuggestionText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function findStrummingPreset(presetId) {
  return STRUMMING_PRESETS.find((preset) => preset.id === presetId) || null;
}

function getSuggestedStrummingPreset({ bpm, difficulty, genre } = {}) {
  const normalizedGenre = normalizeSuggestionText(genre);
  const normalizedDifficulty = normalizeSuggestionText(difficulty);
  const safeBpm = Number(bpm);

  if (normalizedDifficulty === "beginner" || (Number.isFinite(safeBpm) && safeBpm <= 74)) {
    return findStrummingPreset("beginner-downstrums");
  }

  if (/worship|gospel|praise/.test(normalizedGenre)) {
    return findStrummingPreset("worship-build");
  }

  if (/folk|country|americana|singer/.test(normalizedGenre)) {
    return findStrummingPreset("classic-folk");
  }

  if (/pop|island|reggae|calypso/.test(normalizedGenre)) {
    return findStrummingPreset("pop-island");
  }

  if (/r&b|rnb|neo soul|soul/.test(normalizedGenre) && normalizedDifficulty !== "beginner" && (!Number.isFinite(safeBpm) || safeBpm <= 118)) {
    return findStrummingPreset("sixteenth-pop-push");
  }

  if (Number.isFinite(safeBpm) && safeBpm >= 132) {
    return null;
  }

  return findStrummingPreset("classic-folk");
}

function getPatternSignature(pattern) {
  const normalizedPattern = normalizeStrummingPatternData(pattern);

  return `${normalizedPattern.subdivision}:${normalizedPattern.slots.map((slot) => slot.direction || "-").join("")}`;
}

function isDefaultOrEmptyStrummingPattern(pattern) {
  const normalizedPattern = normalizeStrummingPatternData(pattern);
  const defaultPattern = normalizeStrummingPatternData(DEFAULT_CUSTOM_SONG_FORM.strummingPattern);

  if (!hasStrummingPattern(normalizedPattern)) return true;

  return getPatternSignature(normalizedPattern) === getPatternSignature(defaultPattern);
}

function normalizeSongIdentityValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function getSongDuplicateLabel(song) {
  const title = String(song?.title || "Untitled song").trim();
  const artist = String(song?.artist || "").trim();

  return artist ? `${title} by ${artist}` : title;
}

function findLikelyDuplicateSong(song, existingSongs = [], editingSongId = "") {
  const normalizedTitle = normalizeSongIdentityValue(song?.title);
  const normalizedArtist = normalizeSongIdentityValue(song?.artist);

  if (!normalizedTitle) return null;

  return (
    existingSongs.find((existingSong) => {
      if (!existingSong || existingSong.id === editingSongId) return false;

      const existingTitle = normalizeSongIdentityValue(existingSong.title);
      const existingArtist = normalizeSongIdentityValue(existingSong.artist);

      if (!existingTitle || existingTitle !== normalizedTitle) return false;

      if (normalizedArtist && existingArtist) {
        return existingArtist === normalizedArtist;
      }

      return true;
    }) || null
  );
}

function songToForm(song) {
  if (!song) return getDefaultForm();

  return {
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
    strummingPattern: normalizeStrummingPatternData(song.strummingPattern || song.strumming),
    goal: song.goal || DEFAULT_CUSTOM_SONG_FORM.goal,
  };
}

export default function CustomSongForm({
  defaultOpen = false,
  editingSong,
  existingSongs = [],
  genres,
  onAddGenre = noop,
  onAddSong,
  onCancelEdit,
  onClose = noop,
  onOpenChange = noop,
  onUpdateSong,
  showToggle = true,
}) {
  const isEditing = Boolean(editingSong);

  const [form, setForm] = useState(() => getDefaultForm());
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [pendingGenre, setPendingGenre] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("error");

  const previewChords = useMemo(() => parseCommaList(form.chords), [form.chords]);
  const strummingPattern = useMemo(() => normalizeStrummingPatternData(form.strummingPattern), [form.strummingPattern]);
  const strummingPatternText = serializeStrummingPattern(strummingPattern);
  const shouldShowPendingGenre = shouldCreatePendingGenre(form.genre, pendingGenre, genres);

  useEffect(() => {
    if (!defaultOpen) return;

    setIsOpen(true);
    onOpenChange(true);
  }, [defaultOpen, onOpenChange]);

  useEffect(() => {
    if (!editingSong) return;

    setForm(songToForm(editingSong));
    setIsOpen(true);
    onOpenChange(true);
    setDuplicateCandidate(null);
    setPendingGenre("");
    setMessage("");
  }, [editingSong, onOpenChange]);

  function setValidationMessage(value) {
    setMessage(value);
    setMessageTone("error");
  }

  function setInfoMessage(value) {
    setMessage(value);
    setMessageTone("info");
  }

  function setWarningMessage(value) {
    setMessage(value);
    setMessageTone("warning");
  }

  function updateField(fieldName, value) {
    setForm((current) => ({
      ...current,
      [fieldName]: value,
    }));

    if (fieldName === "genre") {
      setPendingGenre((currentPendingGenre) => {
        if (!currentPendingGenre) return "";
        return normalizeGenreValue(value).toLowerCase() === normalizeGenreValue(currentPendingGenre).toLowerCase() ? currentPendingGenre : "";
      });
    }

    setDuplicateCandidate(null);
    setMessage("");
  }

  function resetForm() {
    setForm(isEditing ? songToForm(editingSong) : songToForm(null));
    setDuplicateCandidate(null);
    setPendingGenre("");
    setMessage("");
  }

  function closeForm() {
    setIsOpen(false);
    onOpenChange(false);
    setDuplicateCandidate(null);
    setPendingGenre("");
    setMessage("");
    setForm(songToForm(null));

    if (isEditing) {
      onCancelEdit();
    }

    onClose();
  }

  function applySongAnalysis(analysis) {
    setDuplicateCandidate(null);

    const matchingGenre = getMatchingGenre(analysis.genre, genres);
    const pendingAnalysisGenre = analysis.genre && !matchingGenre ? normalizeGenreValue(analysis.genre) : "";
    const appliedGenre = matchingGenre || pendingAnalysisGenre;
    const appliedBpm = getAppliedBpm(analysis.bpm);
    const suggestedStrummingPreset = getSuggestedStrummingPreset({
      bpm: appliedBpm,
      difficulty: analysis.difficulty,
      genre: appliedGenre,
    });
    const shouldApplySuggestedStrumming = Boolean(suggestedStrummingPreset && isDefaultOrEmptyStrummingPattern(form.strummingPattern));
    const suggestedStrummingPattern = shouldApplySuggestedStrumming ? createPresetStrummingPattern(suggestedStrummingPreset) : null;
    const appliedFields = [
      analysis.title ? "title" : "",
      analysis.artist ? "artist" : "",
      analysis.instrument ? "instrument" : "",
      appliedGenre ? "genre" : "",
      appliedBpm ? "BPM" : "",
      analysis.difficulty ? "difficulty" : "",
      analysis.key ? "key" : "",
      analysis.tuning ? "tuning" : "",
      analysis.capo ? "capo" : "",
      shouldApplySuggestedStrumming ? "strumming pattern" : "",
      analysis.chords?.length ? "chords" : "",
      analysis.transitions?.length ? "transitions" : "",
      analysis.sections?.length ? "sections" : "",
      analysis.goal ? "practice goal" : "",
    ].filter(Boolean);
    const pendingFields = pendingAnalysisGenre ? [`genre “${pendingAnalysisGenre}”`] : [];

    setPendingGenre(pendingAnalysisGenre);

    setForm((current) => ({
      ...current,
      title: analysis.title || current.title,
      artist: analysis.artist || current.artist,
      instrument: analysis.instrument || current.instrument,
      genre: appliedGenre || current.genre,
      bpm: appliedBpm || current.bpm,
      chords: analysis.chords.length ? analysis.chords.join(", ") : current.chords,
      transitions: analysis.transitions.length ? analysis.transitions.join(", ") : current.transitions,
      sections: analysis.sections.length ? sectionsToText(analysis.sections) : current.sections,
      difficulty: analysis.difficulty || current.difficulty,
      key: analysis.key || current.key,
      tuning: analysis.tuning || current.tuning,
      capo: analysis.capo || current.capo,
      strummingPattern: suggestedStrummingPattern || current.strummingPattern,
      goal: !current.goal || current.goal === DEFAULT_CUSTOM_SONG_FORM.goal ? analysis.goal : current.goal,
    }));

    setInfoMessage(
      shouldApplySuggestedStrumming
        ? `Song analysis applied. Suggested strumming: ${suggestedStrummingPreset.name}. Review and edit anything before saving.`
        : "Song analysis applied. Review and edit anything before saving.",
    );

    return {
      appliedFields,
      pendingFields,
    };
  }

  function saveSong({ allowDuplicate = false } = {}) {
    const title = form.title.trim();

    if (!title) {
      setDuplicateCandidate(null);
      setValidationMessage("Add a song title before saving.");
      return;
    }

    if (!form.genre) {
      setDuplicateCandidate(null);
      setValidationMessage("Select a genre before saving.");
      return;
    }

    if (!form.key) {
      setDuplicateCandidate(null);
      setValidationMessage("Select a key before saving.");
      return;
    }

    if (!form.difficulty) {
      setDuplicateCandidate(null);
      setValidationMessage("Select a difficulty before saving.");
      return;
    }

    if (!hasStrummingPattern(strummingPattern)) {
      setDuplicateCandidate(null);
      setValidationMessage("Add at least one down or up strum to the strumming pattern.");
      return;
    }

    const chords = parseCommaList(form.chords);

    if (!chords.length) {
      setDuplicateCandidate(null);
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
      strummingPattern,
      goal: form.goal.trim() || "Practice this song with clean timing and smooth transitions.",
      isCustom: true,
      createdAt: editingSong?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const likelyDuplicate = findLikelyDuplicateSong(song, existingSongs, editingSong?.id);

    if (likelyDuplicate && !allowDuplicate) {
      setDuplicateCandidate(likelyDuplicate);
      setWarningMessage("Review the matching song below before saving anyway.");
      return;
    }

    if (shouldCreatePendingGenre(song.genre, pendingGenre, genres)) {
      onAddGenre(song.genre);
    }

    if (isEditing) {
      onUpdateSong(song);
    } else {
      onAddSong(song);
    }

    setDuplicateCandidate(null);
    setPendingGenre("");
    setMessage("");
    setMessageTone("error");
    setForm(songToForm(null));
    setIsOpen(false);
    onOpenChange(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveSong();
  }

  function handleKeepEditing() {
    setDuplicateCandidate(null);
    setMessage("");
    setMessageTone("error");
  }

  function handleSaveAnyway() {
    saveSong({ allowDuplicate: true });
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
      </div>

      {isOpen ? (
        <form className="custom-song-form" onSubmit={handleSubmit}>
          <SongImportAssistant onApplyAnalysis={applySongAnalysis} />

          <div className="form-grid three">
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
              <div className={`custom-song-genre-select-shell ${shouldShowPendingGenre ? "has-pending-genre" : ""}`}>
                <select aria-label="Genre" value={form.genre} onChange={(event) => updateField("genre", event.target.value)}>
                  <option value="">Select a genre...</option>
                  {shouldShowPendingGenre ? <option value={pendingGenre}>{pendingGenre}</option> : null}
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                {shouldShowPendingGenre ? <span className="custom-song-pending-genre-badge">New</span> : null}
              </div>
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
            value={strummingPattern}
            onChange={(nextPattern) => {
              setForm((current) => ({
                ...current,
                strummingPattern: nextPattern,
              }));
              setMessage("");
            }}
          />

          <div className="form-grid two custom-song-chord-transition-row">
            <label>
              <span>Chords</span>
              <input type="text" value={form.chords} placeholder="G, C, Em, D" onChange={(event) => updateField("chords", event.target.value)} />
            </label>

            <TransitionInput value={form.transitions} onChange={(nextTransitions) => updateField("transitions", nextTransitions)} />
          </div>

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
            <div className="analysis-chip-row">{previewChords.length ? previewChords.map((chord) => <strong key={chord}>{chord}</strong>) : <small>No chords yet</small>}</div>
          </div>

          {duplicateCandidate ? (
            <div className="custom-song-duplicate-warning" role="alert">
              <strong>This looks similar to a song already in your library.</strong>
              <span>{getSongDuplicateLabel(duplicateCandidate)}</span>
            </div>
          ) : null}

          <div className="custom-song-actions">
            <p className={`custom-song-message is-${messageTone}`} aria-live="polite">
              {message}
            </p>

            <div className="custom-song-button-group">
              {duplicateCandidate ? (
                <>
                  <button type="button" className="ghost-button" onClick={handleKeepEditing}>
                    Keep Editing
                  </button>

                  <button type="button" className="complete-session-button" onClick={handleSaveAnyway}>
                    Save Anyway
                  </button>
                </>
              ) : (
                <>
                  {isEditing ? (
                    <button type="button" className="ghost-button" onClick={closeForm}>
                      Cancel Edit
                    </button>
                  ) : (
                    <button type="button" className="preset-button" onClick={resetForm}>
                      Reset Form
                    </button>
                  )}

                  <button type="submit" className="complete-session-button">
                    {isEditing ? "Save Updated Song" : "Save Custom Song"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
