import { formatReferenceMarkerTime, parseTimestampToSeconds } from "./referenceMarkerUtils";

const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";
const VIMEO_OEMBED_ENDPOINT = "https://vimeo.com/api/oembed.json";
const YOUTUBE_DURATION_TIMEOUT_MS = 8000;
const YOUTUBE_DURATION_POLL_INTERVAL_MS = 250;
const YOUTUBE_DURATION_POLL_LIMIT = 24;

let youtubeIframeApiPromise = null;

function getReferenceDurationSeconds(value) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) {
    return Math.max(1, Math.round(Number(value)));
  }

  return parseReferenceDurationInput(value);
}

function parseReferenceDurationInput(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const seconds = parseTimestampToSeconds(text);

  if (seconds === null || seconds <= 0) return null;

  return Math.max(1, seconds);
}

function formatReferenceDuration(seconds) {
  const safeSeconds = getReferenceDurationSeconds(seconds);

  return safeSeconds ? formatReferenceMarkerTime(safeSeconds) : "";
}

function getDurationDetectionSupport(referenceTrack) {
  if (!referenceTrack?.isValid && !referenceTrack?.url) return "unsupported";

  if (referenceTrack.platform === "youtube" && referenceTrack.mediaId) return "youtube";
  if (referenceTrack.platform === "vimeo" && referenceTrack.url) return "vimeo";

  return "unsupported";
}

function getReferenceDurationSourceLabel(referenceTrack) {
  if (referenceTrack?.platformLabel) return referenceTrack.platformLabel;

  if (referenceTrack?.platform === "youtube") return "YouTube";
  if (referenceTrack?.platform === "vimeo") return "Vimeo";

  return "reference";
}

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube duration detection requires a browser window."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise;
  }

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    let timeoutId = null;

    function cleanup() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReadyHandler === "function") {
        previousReadyHandler();
      }

      cleanup();

      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube IFrame API loaded without a Player constructor."));
      }
    };

    const existingScript = document.querySelector(`script[src="${YOUTUBE_IFRAME_API_SRC}"]`);

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = YOUTUBE_IFRAME_API_SRC;
      script.async = true;
      script.onerror = () => {
        cleanup();
        reject(new Error("Unable to load the YouTube IFrame API."));
      };
      document.head.appendChild(script);
    }

    timeoutId = window.setTimeout(() => {
      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }

      reject(new Error("Timed out while loading the YouTube IFrame API."));
    }, YOUTUBE_DURATION_TIMEOUT_MS);
  });

  return youtubeIframeApiPromise;
}

function pollYouTubeDuration(player, { isCancelled = () => false } = {}) {
  return new Promise((resolve) => {
    let attempts = 0;

    function checkDuration() {
      if (isCancelled()) {
        resolve(null);
        return;
      }

      attempts += 1;

      const duration = Number(player.getDuration?.() || 0);

      if (Number.isFinite(duration) && duration > 0) {
        resolve(Math.round(duration));
        return;
      }

      if (attempts >= YOUTUBE_DURATION_POLL_LIMIT) {
        resolve(null);
        return;
      }

      window.setTimeout(checkDuration, YOUTUBE_DURATION_POLL_INTERVAL_MS);
    }

    checkDuration();
  });
}

async function resolveYouTubeDuration(referenceTrack, { container, isCancelled = () => false } = {}) {
  if (!container || !referenceTrack?.mediaId) return null;

  const YT = await loadYouTubeIframeApi();

  if (isCancelled()) return null;

  return new Promise((resolve) => {
    let player = null;
    let timeoutId = null;
    let didResolve = false;

    function finish(seconds = null) {
      if (didResolve) return;

      didResolve = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      try {
        player?.destroy?.();
      } catch {
        // No-op. Destroy can throw if the iframe was already removed during unmount.
      }

      resolve(seconds);
    }

    timeoutId = window.setTimeout(() => {
      finish(null);
    }, YOUTUBE_DURATION_TIMEOUT_MS);

    player = new YT.Player(container, {
      height: "1",
      playerVars: {
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      videoId: referenceTrack.mediaId,
      width: "1",
      events: {
        onReady: async () => {
          const duration = await pollYouTubeDuration(player, { isCancelled });

          finish(duration);
        },
        onError: () => {
          finish(null);
        },
      },
    });
  });
}

async function resolveVimeoDuration(referenceTrack) {
  if (!referenceTrack?.url) return null;

  const response = await fetch(`${VIMEO_OEMBED_ENDPOINT}?url=${encodeURIComponent(referenceTrack.url)}`);

  if (!response.ok) return null;

  const data = await response.json();
  const duration = Number(data?.duration || 0);

  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

async function resolveReferenceDuration(referenceTrack, { container, isCancelled = () => false } = {}) {
  const support = getDurationDetectionSupport(referenceTrack);

  if (support === "youtube") {
    return resolveYouTubeDuration(referenceTrack, {
      container,
      isCancelled,
    });
  }

  if (support === "vimeo") {
    return resolveVimeoDuration(referenceTrack);
  }

  return null;
}

export {
  formatReferenceDuration,
  getDurationDetectionSupport,
  getReferenceDurationSeconds,
  getReferenceDurationSourceLabel,
  parseReferenceDurationInput,
  resolveReferenceDuration,
};
