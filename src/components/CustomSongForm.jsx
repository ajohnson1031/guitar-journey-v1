import * as React from "react";
import { DEFAULT_CUSTOM_SONG_FORM, KEY_OPTIONS } from "../constants";
import { getStoredReferenceMetadata } from "../utils/referenceMetadataUtils";
import { getReferenceMetadataSourceClassName, getReferenceMetadataSourceLabel } from "../utils/referenceMetadataSourceUtils";
import { extractReferenceMarkersFromText, getReferenceTimestampExtractionSummary, referenceTimestampMarkersToText } from "../utils/referenceTimestampExtractionUtils";
import { createFieldDetectionStatus, getFieldDetectionStatusClassName, hasFieldDetectionValue } from "../utils/fieldDetectionStatusUtils";
import { parseReferenceTrackUrl } from "../utils/referenceTrackUtils";
import { formatReferenceMarkerTime, parseReferenceMarkers, referenceMarkersToText } from "../utils/referenceMarkerUtils";
import { getReferenceDurationSeconds, getSuggestedReferenceMarkerSummary, suggestedReferenceMarkersToText, mergeReferenceMarkerDraft, parseReferenceDurationInput } from "../utils/referenceMarkerSuggestionUtils";
import { parseCommaList, parseSections, slugify } from "../utils/songFormUtils";
import { STRUMMING_PRESETS, createPresetStrummingPattern, hasStrummingPattern, normalizeStrummingPatternData, serializeStrummingPattern } from "../utils/strummingUtils";
import ReferenceDurationResolver from "./ReferenceDurationResolver";
import ReferenceMetadataResolver from "./ReferenceMetadataResolver";
import ReferenceMetadataDebugPanel from "./ReferenceMetadataDebugPanel";
import ReferenceMarkerReviewDraft from "./ReferenceMarkerReviewDraft";
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
    referenceDuration: "",
    referenceMarkers: "",
    referenceTimestampText: "",
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

function formatReferenceDurationInput(seconds) {
  return seconds ? formatReferenceMarkerTime(seconds) : "";
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
    sourceUrl: song.sourceUrl || song.referenceTrack?.url || "",
    referenceDuration: song.referenceDurationSeconds ? formatReferenceDurationInput(song.referenceDurationSeconds) : "",
    referenceMarkers: referenceMarkersToText(song.referenceMarkers || song.sectionMarkers || []),
    referenceTimestampText: song.referenceTimestampText || "",
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

function draftToForm(draft) {
  if (!draft) return getDefaultForm();

  return {
    ...getDefaultForm(),
    sourceUrl: draft.sourceUrl || draft.referenceTrack?.url || "",
    referenceDuration: draft.referenceDurationSeconds ? formatReferenceDurationInput(draft.referenceDurationSeconds) : draft.referenceDuration || "",
    referenceMarkers: referenceMarkersToText(draft.referenceMarkers || draft.sectionMarkers || []),
    referenceTimestampText: draft.referenceTimestampText || draft.referenceChapterText || draft.referenceTrack?.chapterText || "",
    artist: draft.artist || "",
    instrument: draft.instrument || "",
    title: draft.title || "",
    genre: draft.genre || "",
    key: draft.key || "",
    tuning: draft.tuning || "",
    capo: draft.capo || "",
    bpm: draft.bpm ? String(draft.bpm) : DEFAULT_CUSTOM_SONG_FORM.bpm,
    difficulty: draft.difficulty || "",
    chords: Array.isArray(draft.chords) ? draft.chords.join(", ") : draft.chords || DEFAULT_CUSTOM_SONG_FORM.chords,
    transitions: Array.isArray(draft.transitions) ? draft.transitions.join(", ") : draft.transitions || "",
    sections: Array.isArray(draft.sections) ? sectionsToText(draft.sections) : draft.sections || DEFAULT_CUSTOM_SONG_FORM.sections,
    strummingPattern: normalizeStrummingPatternData(draft.strummingPattern || draft.strumming || DEFAULT_CUSTOM_SONG_FORM.strummingPattern),
    goal: draft.goal || DEFAULT_CUSTOM_SONG_FORM.goal,
  };
}

function getMetadataFieldStatus(formValue, detectedValue, statusSource) {
  if (detectedValue && String(formValue || "").trim() === String(detectedValue || "").trim()) {
    return "detected";
  }

  if (detectedValue && hasFieldDetectionValue(formValue)) {
    return "overridden";
  }

  if (hasFieldDetectionValue(formValue) && statusSource) {
    return "needs-review";
  }

  if (hasFieldDetectionValue(formValue)) {
    return "manual";
  }

  return "missing";
}

function DetectedSetupFieldCard({ label, message, onManualClick, sourceLabel, status, value }) {
  const statusInfo = createFieldDetectionStatus({
    message,
    sourceLabel,
    status,
    value,
  });
  const actionLabel = statusInfo.status === "missing" ? "Add manually" : "Review manually";

  return (
    <article className={`detected-setup-field-card ${getFieldDetectionStatusClassName(statusInfo.status)}`}>
      <div>
        <div className="detected-setup-field-heading">
          <span className="detected-setup-field-label">{label}</span>
          <span className={`detected-setup-status-pill ${getFieldDetectionStatusClassName(statusInfo.status)}`}>
            {statusInfo.label}
          </span>
        </div>

        <strong>{statusInfo.hasValue ? value : "Not detected"}</strong>
        <p>{statusInfo.description}</p>
      </div>

      {statusInfo.requiresAction ? (
        <button type="button" onClick={onManualClick}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

function DetectedSetupReviewPanel({
  detectedReferenceMarkerSource,
  detectedReferenceMarkers,
  form,
  onApplyDetectedReferenceMarkers,
  onDismissDetectedReferenceMarkers,
  onManualClick,
  previewChords,
  referenceMetadata,
  referenceMetadataStatus,
  referenceTrack,
  strummingPattern,
  strummingPatternText,
}) {
  const metadataSourceLabel = referenceMetadata
    ? getReferenceMetadataSourceLabel(referenceMetadata)
    : referenceMetadataStatus?.sourceLabel || referenceTrack?.platformLabel || "";
  const referenceMarkerCount = parseReferenceMarkers(form.referenceMarkers).length;
  const detectedMarkerValue = detectedReferenceMarkers.length
    ? `${detectedReferenceMarkers.length} detected marker${detectedReferenceMarkers.length === 1 ? "" : "s"}`
    : referenceMarkerCount
      ? `${referenceMarkerCount} reference marker${referenceMarkerCount === 1 ? "" : "s"} ready`
      : "";
  const strummingHasValue = hasStrummingPattern(strummingPattern);
  const fields = [
    {
      label: "Song Title",
      value: form.title,
      sourceLabel: metadataSourceLabel || "Detected setup",
      status: getMetadataFieldStatus(form.title, referenceMetadata?.title, metadataSourceLabel),
      message: "Song title could not be automatically extracted. Add it manually.",
    },
    {
      label: "Artist",
      value: form.artist,
      sourceLabel: metadataSourceLabel || "Detected setup",
      status: getMetadataFieldStatus(form.artist, referenceMetadata?.authorName, metadataSourceLabel),
      message: "Artist could not be automatically extracted. Add it manually.",
    },
    {
      label: "Reference Duration",
      value: form.referenceDuration,
      sourceLabel: metadataSourceLabel || "Detected setup",
      status: referenceMetadata?.durationSeconds ? "detected" : form.referenceDuration ? "manual" : "missing",
      message: "Reference duration could not be automatically extracted. Add it manually.",
    },
    {
      label: "Song Chapters",
      value: detectedMarkerValue,
      sourceLabel: detectedReferenceMarkerSource || metadataSourceLabel || "Detected setup",
      status: detectedReferenceMarkers.length ? "detected" : referenceMarkerCount ? "manual" : "missing",
      message: "Song chapters could not be automatically extracted. Add markers manually.",
    },
    {
      label: "Strum Pattern",
      value: strummingHasValue ? strummingPatternText : "",
      sourceLabel: "Practice setup",
      status: strummingHasValue ? "needs-review" : "missing",
      message: "Strum pattern could not be automatically extracted. Choose or build one manually.",
    },
    {
      label: "Chords",
      value: previewChords.length ? previewChords.join(", ") : "",
      sourceLabel: "Practice setup",
      status: previewChords.length ? "needs-review" : "missing",
      message: "Chords could not be automatically extracted. Add them manually.",
    },
    {
      label: "Genre",
      value: form.genre,
      sourceLabel: "Practice setup",
      status: form.genre ? "needs-review" : "missing",
      message: "Genre could not be automatically extracted. Select it manually.",
    },
    {
      label: "Key",
      value: form.key,
      sourceLabel: "Practice setup",
      status: form.key ? "needs-review" : "missing",
      message: "Key could not be automatically extracted. Select it manually.",
    },
    {
      label: "Difficulty",
      value: form.difficulty,
      sourceLabel: "Practice setup",
      status: form.difficulty ? "needs-review" : "missing",
      message: "Difficulty could not be automatically extracted. Select it manually.",
    },
    {
      label: "BPM",
      value: form.bpm,
      sourceLabel: "Practice setup",
      status: form.bpm ? "needs-review" : "missing",
      message: "BPM could not be automatically extracted. Add it manually.",
    },
  ];
  const fieldsWithStatus = fields.map((field) => ({
    ...field,
    statusInfo: createFieldDetectionStatus(field),
  }));
  const attentionFields = fieldsWithStatus.filter((field) => field.statusInfo.requiresAction);

  return (
    <section className="detected-setup-panel">
      <div className="detected-setup-header">
        <div>
          <p className="eyebrow">Detected Setup</p>
          <h3>Review what Guitar Journey found</h3>
          <p>
            Use this as the assisted setup path. Missing fields can be completed in Manual Inputs before saving.
          </p>
        </div>

        <button type="button" className="detected-setup-manual-link" onClick={onManualClick}>
          Open Manual Inputs
        </button>
      </div>

      <div className="detected-setup-field-grid">
        {fieldsWithStatus.map((field) => (
          <DetectedSetupFieldCard
            key={field.label}
            label={field.label}
            message={field.message}
            sourceLabel={field.sourceLabel}
            status={field.status}
            value={field.value}
            onManualClick={onManualClick}
          />
        ))}
      </div>

      {attentionFields.length ? (
        <div className="detected-setup-gap-card">
          <strong>{attentionFields.length} field{attentionFields.length === 1 ? "" : "s"} need review or manual input</strong>
          <span>{attentionFields.map((field) => `${field.label}: ${field.statusInfo.label}`).join(" · ")}</span>
        </div>
      ) : (
        <div className="detected-setup-gap-card is-complete">
          <strong>Detected setup looks complete</strong>
          <span>Review the values, then save or make manual edits.</span>
        </div>
      )}

      <ReferenceMarkerReviewDraft
        currentMarkerText={form.referenceMarkers}
        markers={detectedReferenceMarkers}
        sourceLabel={detectedReferenceMarkerSource}
        onApply={onApplyDetectedReferenceMarkers}
        onDismiss={onDismissDetectedReferenceMarkers}
      />
    </section>
  );
}

export default function CustomSongForm({
  defaultOpen = false,
  editingSong,
  existingSongs = [],
  initialSongDraft = null,
  genres,
  onAddGenre = noop,
  onAddSong,
  onCancelEdit,
  onClose = noop,
  onOpenChange = noop,
  onUpdateSong,
  showToggle: _showToggle = true,
}) {
  const isEditing = Boolean(editingSong);

  const [form, setForm] = useState(() => getDefaultForm());
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [pendingGenre, setPendingGenre] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("error");
  const [referenceDurationStatus, setReferenceDurationStatus] = useState({
    message: "",
    tone: "idle",
  });
  const [hasManuallyEditedReferenceDuration, setHasManuallyEditedReferenceDuration] = useState(false);
  const [referenceMetadata, setReferenceMetadata] = useState(null);
  const [referenceMetadataStatus, setReferenceMetadataStatus] = useState({
    message: "",
    tone: "idle",
  });
  const [detectedReferenceMarkers, setDetectedReferenceMarkers] = useState([]);
  const [detectedReferenceMarkerSource, setDetectedReferenceMarkerSource] = useState("");
  const [activeSetupTab, setActiveSetupTab] = useState("detected");

  const referenceTrack = useMemo(() => parseReferenceTrackUrl(form.sourceUrl), [form.sourceUrl]);
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
    setReferenceDurationStatus({
      message: "",
      tone: "idle",
    });
    setReferenceMetadataStatus({
      message: "",
      tone: "idle",
    });
    setReferenceMetadata(getStoredReferenceMetadata(editingSong?.referenceTrack));
    setDetectedReferenceMarkers(getStoredReferenceMetadata(editingSong?.referenceTrack)?.extractedMarkers || []);
    setDetectedReferenceMarkerSource(getStoredReferenceMetadata(editingSong?.referenceTrack)?.extractedMarkers?.length ? "Saved metadata" : "");
    setHasManuallyEditedReferenceDuration(false);
  }, [editingSong, onOpenChange]);

  useEffect(() => {
    if (editingSong || !initialSongDraft) return;

    setForm(draftToForm(initialSongDraft));
    setIsOpen(true);
    onOpenChange(true);
    setDuplicateCandidate(null);
    setPendingGenre("");
    setMessage("");
    setReferenceDurationStatus({
      message: "",
      tone: "idle",
    });
    setReferenceMetadataStatus({
      message: "",
      tone: "idle",
    });
    setReferenceMetadata(getStoredReferenceMetadata(initialSongDraft?.referenceTrack));
    setDetectedReferenceMarkers(getStoredReferenceMetadata(initialSongDraft?.referenceTrack)?.extractedMarkers || []);
    setDetectedReferenceMarkerSource(getStoredReferenceMetadata(initialSongDraft?.referenceTrack)?.extractedMarkers?.length ? "Detected metadata" : "");
    setHasManuallyEditedReferenceDuration(false);
  }, [editingSong, initialSongDraft, onOpenChange]);

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
    setForm((current) => {
      if (fieldName === "sourceUrl") {
        return {
          ...current,
          sourceUrl: value,
          referenceDuration: "",
        };
      }

      return {
        ...current,
        [fieldName]: value,
      };
    });

    if (fieldName === "sourceUrl") {
      setReferenceDurationStatus({
        message: "",
        tone: "idle",
      });
      setReferenceMetadataStatus({
        message: "",
        tone: "idle",
      });
      setReferenceMetadata(null);
      setDetectedReferenceMarkers([]);
      setDetectedReferenceMarkerSource("");
      setHasManuallyEditedReferenceDuration(false);
    }

    if (fieldName === "referenceDuration") {
      setHasManuallyEditedReferenceDuration(true);
      setReferenceDurationStatus({
        message: value.trim() ? "Manual duration override active." : "",
        tone: value.trim() ? "muted" : "idle",
      });
    }

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
    setReferenceMetadata(getStoredReferenceMetadata(editingSong?.referenceTrack));
    setDetectedReferenceMarkers(getStoredReferenceMetadata(editingSong?.referenceTrack)?.extractedMarkers || []);
    setDetectedReferenceMarkerSource(getStoredReferenceMetadata(editingSong?.referenceTrack)?.extractedMarkers?.length ? "Saved metadata" : "");
    setReferenceMetadataStatus({
      message: "",
      tone: "idle",
    });
    setActiveSetupTab("detected");
    setMessage("");
  }

  function closeForm() {
    setIsOpen(false);
    onOpenChange(false);
    setDuplicateCandidate(null);
    setPendingGenre("");
    setReferenceMetadata(null);
    setDetectedReferenceMarkers([]);
    setDetectedReferenceMarkerSource("");
    setReferenceMetadataStatus({
      message: "",
      tone: "idle",
    });
    setActiveSetupTab("detected");
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


  function handleReferenceTimestampTextExtraction() {
    const markers = extractReferenceMarkersFromText(form.referenceTimestampText);

    setDetectedReferenceMarkers(markers);
    setDetectedReferenceMarkerSource(markers.length ? "Pasted timestamp text" : "");

    if (!markers.length) {
      setWarningMessage("No timestamp markers were detected in the pasted text.");
      return;
    }

    setInfoMessage(getReferenceTimestampExtractionSummary(markers));
  }

  function handleApplyDetectedReferenceMarkers() {
    if (!detectedReferenceMarkers.length) return;

    const detectedMarkerText = referenceTimestampMarkersToText(detectedReferenceMarkers);
    const nextMarkerText = mergeReferenceMarkerDraft({
      currentText: form.referenceMarkers,
      draftText: detectedMarkerText,
    });

    setForm((current) => ({
      ...current,
      referenceMarkers: nextMarkerText,
    }));

    setInfoMessage(`${detectedReferenceMarkers.length} detected marker${detectedReferenceMarkers.length === 1 ? "" : "s"} applied. Review the marker list before saving.`);
  }

  function handleDismissDetectedReferenceMarkers() {
    setDetectedReferenceMarkers([]);
    setDetectedReferenceMarkerSource("");
    setInfoMessage("Detected marker suggestion dismissed. You can still enter markers manually.");
  }

  function handleReferenceMetadataResolved(metadata) {
    if (!metadata) return;

    setReferenceMetadata(metadata);

    if (metadata.extractedMarkers?.length) {
      setDetectedReferenceMarkers(metadata.extractedMarkers);
      setDetectedReferenceMarkerSource(getReferenceMetadataSourceLabel(metadata));
    }

    setForm((current) => ({
      ...current,
      artist: current.artist.trim() ? current.artist : metadata.authorName || current.artist,
      referenceDuration:
        current.referenceDuration.trim() || hasManuallyEditedReferenceDuration || !metadata.durationSeconds
          ? current.referenceDuration
          : formatReferenceDurationInput(metadata.durationSeconds),
      title: current.title.trim() ? current.title : metadata.title || current.title,
    }));
  }

  function shouldAutoDetectReferenceMetadata() {
    return Boolean(referenceTrack.isValid && !referenceTrack.isEmpty && !referenceMetadata);
  }

  function handleReferenceDurationResolved(seconds) {
    const formattedDuration = formatReferenceDurationInput(seconds);

    if (!formattedDuration) return;

    setForm((current) => {
      if (hasManuallyEditedReferenceDuration || current.referenceDuration.trim()) return current;

      return {
        ...current,
        referenceDuration: formattedDuration,
      };
    });
  }

  function shouldAutoDetectReferenceDuration() {
    return Boolean(referenceTrack.isValid && !referenceTrack.isEmpty && !hasManuallyEditedReferenceDuration && !form.referenceDuration.trim());
  }

  function handleGenerateReferenceMarkerDraft() {
    const sections = parseSections(form.sections);

    if (!sections.length) {
      setWarningMessage("Add song sections before generating a reference marker draft.");
      return;
    }

    const referenceDurationSeconds = getReferenceDurationSeconds(form.referenceDuration);

    if (form.referenceDuration.trim() && !referenceDurationSeconds) {
      setWarningMessage("Enter reference duration as seconds, M:SS, or H:MM:SS before generating a marker draft.");
      return;
    }

    const draftText = suggestedReferenceMarkersToText({
      bpm: form.bpm,
      referenceDurationSeconds,
      sections,
    });

    if (!draftText) {
      setWarningMessage("Add song sections before generating a reference marker draft.");
      return;
    }

    const hasCurrentMarkers = parseReferenceMarkers(form.referenceMarkers).length > 0;
    const nextMarkerText = hasCurrentMarkers
      ? mergeReferenceMarkerDraft({
          currentText: form.referenceMarkers,
          draftText,
        })
      : draftText;

    setForm((current) => ({
      ...current,
      referenceMarkers: nextMarkerText,
    }));

    setInfoMessage(
      hasCurrentMarkers
        ? "Missing section markers were added to the existing marker list. Review the timestamps before saving."
        : getSuggestedReferenceMarkerSummary({
            bpm: form.bpm,
            referenceDurationSeconds,
            sections,
          }),
    );
  }

  function saveSong({ allowDuplicate = false } = {}) {
    const title = form.title.trim();

    if (!title) {
      setDuplicateCandidate(null);
      setValidationMessage("Add a song title before saving.");
      return;
    }

    if (form.sourceUrl.trim() && !referenceTrack.isValid) {
      setDuplicateCandidate(null);
      setValidationMessage(referenceTrack.error || "Enter a valid reference track URL before saving.");
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

    const parsedReferenceTrack = form.sourceUrl.trim() ? referenceTrack : null;
    const referenceDurationSeconds = parseReferenceDurationInput(form.referenceDuration) || referenceMetadata?.durationSeconds || null;
    const referenceMarkers = parseReferenceMarkers(form.referenceMarkers);

    if (form.referenceDuration.trim() && !referenceDurationSeconds) {
      setDuplicateCandidate(null);
      setValidationMessage("Enter reference duration as seconds, M:SS, or H:MM:SS before saving.");
      return;
    }

    const song = {
      id: editingSong?.id || `custom-${slugify(title)}-${Date.now()}`,
      sourceUrl: parsedReferenceTrack?.url || "",
      referenceTrack: parsedReferenceTrack?.isValid
        ? {
            authorName: referenceMetadata?.authorName || "",
            chapterText: referenceMetadata?.chapterText || "",
            descriptionText: referenceMetadata?.descriptionText || "",
            durationSeconds: referenceDurationSeconds || null,
            embedUrl: parsedReferenceTrack.embedUrl,
            extractedMarkers: detectedReferenceMarkers,
            kind: parsedReferenceTrack.kind,
            mediaId: parsedReferenceTrack.mediaId,
            metadataText: referenceMetadata?.metadataText || "",
            platform: parsedReferenceTrack.platform,
            platformLabel: parsedReferenceTrack.platformLabel,
            providerName: referenceMetadata?.providerName || parsedReferenceTrack.platformLabel,
            source: referenceMetadata?.source || parsedReferenceTrack.platform || "generic",
            sourceLabel: referenceMetadata?.sourceLabel || parsedReferenceTrack.platformLabel || "",
            sourceType: referenceMetadata?.sourceType || "",
            thumbnailUrl: referenceMetadata?.thumbnailUrl || "",
            title: referenceMetadata?.title || "",
            url: parsedReferenceTrack.url,
          }
        : null,
      referenceDurationSeconds: referenceDurationSeconds || null,
      referenceDetectedMarkers: detectedReferenceMarkers,
      referenceMarkers,
      referenceTimestampText: form.referenceTimestampText.trim(),
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
    setActiveSetupTab("detected");
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

          <div className="import-link-card reference-track-card">
            <div className="reference-track-inline-fields">
              <label className="reference-track-url-field">
                <span>Reference Track URL</span>
                <input
                  type="url"
                  value={form.sourceUrl}
                  placeholder="Paste a YouTube, Vimeo, Spotify, SoundCloud, or reference link"
                  onChange={(event) => updateField("sourceUrl", event.target.value)}
                />
              </label>

              <div className="reference-duration-field reference-duration-field--inline">
                <label>
                  <span>Reference Duration</span>
                  <input
                    type="text"
                    value={form.referenceDuration}
                    placeholder="4:34"
                    onChange={(event) => updateField("referenceDuration", event.target.value)}
                  />
                </label>
              </div>
            </div>

            <p>Optional: save a reference track now so this song can support future timestamp sync and arrangement analysis.</p>

            {!referenceTrack.isEmpty && !referenceTrack.isValid ? <p className="custom-song-message is-warning">{referenceTrack.error}</p> : null}

            <ReferenceMetadataResolver
              enabled={shouldAutoDetectReferenceMetadata()}
              referenceTrack={referenceTrack}
              onResolve={handleReferenceMetadataResolved}
              onStatusChange={setReferenceMetadataStatus}
            />

            <ReferenceDurationResolver
              enabled={shouldAutoDetectReferenceDuration()}
              referenceTrack={referenceTrack}
              onResolve={handleReferenceDurationResolved}
              onStatusChange={setReferenceDurationStatus}
            />

            {referenceMetadataStatus.message ? <p className={`reference-metadata-status is-${referenceMetadataStatus.tone}`}>{referenceMetadataStatus.message}</p> : null}

            {referenceMetadata ? (
              <div className="reference-metadata-source-row">
                <span>Metadata source</span>
                <span className={`reference-metadata-source-pill ${getReferenceMetadataSourceClassName(referenceMetadata)}`}>
                  {getReferenceMetadataSourceLabel(referenceMetadata)}
                </span>
              </div>
            ) : null}

            {referenceDurationStatus.message ? <p className={`reference-duration-status is-${referenceDurationStatus.tone}`}>{referenceDurationStatus.message}</p> : null}

            <ReferenceMetadataDebugPanel
              metadata={referenceMetadata}
              metadataStatus={referenceMetadataStatus}
              referenceTrack={referenceTrack}
            />

            <div className="custom-song-setup-tabs" role="tablist" aria-label="Song setup mode">
              <button
                type="button"
                role="tab"
                aria-selected={activeSetupTab === "detected"}
                className={activeSetupTab === "detected" ? "is-active" : ""}
                onClick={() => setActiveSetupTab("detected")}
              >
                Detected Setup
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeSetupTab === "manual"}
                className={activeSetupTab === "manual" ? "is-active" : ""}
                onClick={() => setActiveSetupTab("manual")}
              >
                Manual Inputs
              </button>
            </div>

            <div className={`custom-song-tab-panel ${activeSetupTab === "detected" ? "is-active" : "is-inactive"}`} role="tabpanel">
              <DetectedSetupReviewPanel
                detectedReferenceMarkerSource={detectedReferenceMarkerSource}
                detectedReferenceMarkers={detectedReferenceMarkers}
                form={form}
                onApplyDetectedReferenceMarkers={handleApplyDetectedReferenceMarkers}
                onDismissDetectedReferenceMarkers={handleDismissDetectedReferenceMarkers}
                onManualClick={() => setActiveSetupTab("manual")}
                previewChords={previewChords}
                referenceMetadata={referenceMetadata}
                referenceMetadataStatus={referenceMetadataStatus}
                referenceTrack={referenceTrack}
                strummingPattern={strummingPattern}
                strummingPatternText={strummingPatternText}
              />
            </div>

            <div className={`custom-song-tab-panel ${activeSetupTab === "manual" ? "is-active" : "is-inactive"}`} role="tabpanel">
              <div className="reference-timestamp-extraction-field">
                <div className="reference-marker-field-header">
                  <label htmlFor="reference-timestamp-textarea">
                    <span>Paste chapters / raw timestamps</span>
                  </label>

                  <button type="button" className="reference-marker-draft-button" onClick={handleReferenceTimestampTextExtraction}>
                    Extract timestamps
                  </button>
                </div>

                <textarea
                  id="reference-timestamp-textarea"
                  value={form.referenceTimestampText}
                  placeholder={"Paste chapters or timestamp text, e.g.\n0:00 Intro\n0:12 Verse\n0:48 Chorus"}
                  onChange={(event) => updateField("referenceTimestampText", event.target.value)}
                />

                <p>Optional helper: paste raw chapters or timestamps, then extract them into a reviewable marker draft.</p>
              </div>

              <ReferenceMarkerReviewDraft
                currentMarkerText={form.referenceMarkers}
                markers={detectedReferenceMarkers}
                sourceLabel={detectedReferenceMarkerSource}
                onApply={handleApplyDetectedReferenceMarkers}
                onDismiss={handleDismissDetectedReferenceMarkers}
              />

              <div className="reference-marker-field">
                <div className="reference-marker-field-header">
                  <label htmlFor="reference-markers-textarea">
                    <span>Reference Markers</span>
                  </label>

                  <button type="button" className="reference-marker-draft-button" onClick={handleGenerateReferenceMarkerDraft}>
                    Generate marker draft
                  </button>
                </div>

                <textarea
                  id="reference-markers-textarea"
                  value={form.referenceMarkers}
                  placeholder={"Intro: 0:00\nVerse: 0:12\nChorus: 0:48"}
                  onChange={(event) => updateField("referenceMarkers", event.target.value)}
                />
              </div>

              <p>Reference Markers are the saved timeline. Use raw timestamp text only as an extraction helper.</p>
            </div>
          </div>

          <div className={`custom-song-tab-panel custom-song-manual-fields ${activeSetupTab === "manual" ? "is-active" : "is-inactive"}`} role="tabpanel">
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
