import * as React from "react";

const { useCallback, useEffect, useMemo, useState } = React;

const MIN_BPM = 40;
const MAX_BPM = 220;
const DEFAULT_BPM = 72;

let tempoOverrideState = {
  adjustedBpm: null,
  originalBpm: null,
  songId: null,
};

const subscribers = new Set();

function clampBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return DEFAULT_BPM;

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

function emitTempoOverrideState() {
  subscribers.forEach((subscriber) => subscriber(tempoOverrideState));
}

function setTempoOverrideState(nextState) {
  tempoOverrideState = {
    ...tempoOverrideState,
    ...nextState,
  };

  emitTempoOverrideState();
}

export function getOriginalSongBpm(song) {
  return clampBpm(song?.bpm);
}

export function getEffectiveSongBpm(song) {
  const originalBpm = getOriginalSongBpm(song);

  if (!song?.id) return originalBpm;

  if (tempoOverrideState.songId === song.id && tempoOverrideState.adjustedBpm) {
    return tempoOverrideState.adjustedBpm;
  }

  return originalBpm;
}

export function isSongBpmAdjusted(song) {
  if (!song?.id) return false;

  return tempoOverrideState.songId === song.id && Boolean(tempoOverrideState.adjustedBpm);
}

export function setTemporarySongBpm(song, bpm) {
  if (!song?.id) return;

  const originalBpm = getOriginalSongBpm(song);
  const adjustedBpm = clampBpm(bpm);

  if (adjustedBpm === originalBpm) {
    clearTemporarySongBpm(song.id);
    return;
  }

  setTempoOverrideState({
    adjustedBpm,
    originalBpm,
    songId: song.id,
  });
}

export function clearTemporarySongBpm(songId = tempoOverrideState.songId) {
  if (!songId || tempoOverrideState.songId !== songId) return;

  setTempoOverrideState({
    adjustedBpm: null,
    originalBpm: null,
    songId: null,
  });
}

export function getTempoOverrideState() {
  return tempoOverrideState;
}

export default function useTempoOverride(song) {
  const [state, setState] = useState(() => getTempoOverrideState());

  useEffect(() => {
    subscribers.add(setState);

    return () => {
      subscribers.delete(setState);
    };
  }, []);

  const originalBpm = useMemo(() => getOriginalSongBpm(song), [song]);
  const effectiveBpm = useMemo(() => {
    if (!song?.id) return originalBpm;

    if (state.songId === song.id && state.adjustedBpm) {
      return state.adjustedBpm;
    }

    return originalBpm;
  }, [originalBpm, song?.id, state.adjustedBpm, state.songId]);

  const isAdjusted = Boolean(song?.id && state.songId === song.id && state.adjustedBpm);

  const setAdjustedBpm = useCallback(
    (bpm) => {
      setTemporarySongBpm(song, bpm);
    },
    [song],
  );

  const clearAdjustedBpm = useCallback(() => {
    clearTemporarySongBpm(song?.id);
  }, [song?.id]);

  return {
    adjustedBpm: isAdjusted ? state.adjustedBpm : null,
    clearAdjustedBpm,
    effectiveBpm,
    isAdjusted,
    originalBpm,
    setAdjustedBpm,
  };
}
