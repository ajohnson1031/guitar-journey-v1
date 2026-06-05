const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const SPOTIFY_HOSTS = new Set(["open.spotify.com", "play.spotify.com"]);
const SOUNDCLOUD_HOSTS = new Set(["soundcloud.com", "www.soundcloud.com"]);

const PLATFORM_LABELS = {
  generic: "Reference",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  vimeo: "Vimeo",
  youtube: "YouTube",
};

function normalizeCandidateUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function getHostname(url) {
  return url.hostname.replace(/^www\./, "www.");
}

function getPlatformLabel(platform) {
  return PLATFORM_LABELS[platform] || PLATFORM_LABELS.generic;
}

function getYouTubeId(url) {
  if (url.hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] || "";
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v") || "";
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const marker = pathParts.find((part) => ["embed", "shorts", "live"].includes(part));

  if (marker) {
    const markerIndex = pathParts.indexOf(marker);
    return pathParts[markerIndex + 1] || "";
  }

  return "";
}

function getVimeoId(url) {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const videoIndex = pathParts.indexOf("video");

  if (videoIndex >= 0) {
    return pathParts[videoIndex + 1] || "";
  }

  return pathParts.find((part) => /^\d+$/.test(part)) || "";
}

function getSpotifyReference(url) {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const kind = pathParts[0] || "";
  const mediaId = pathParts[1] || "";

  if (!kind || !mediaId) {
    return {
      kind: "",
      mediaId: "",
    };
  }

  return {
    kind,
    mediaId,
  };
}

function getSoundCloudReference(url) {
  const pathParts = url.pathname.split("/").filter(Boolean);

  return {
    kind: pathParts.length > 1 ? "track" : "profile",
    mediaId: pathParts.join("/"),
  };
}

function parseReferenceTrackUrl(value) {
  const normalizedUrl = normalizeCandidateUrl(value);

  if (!normalizedUrl) {
    return {
      displayUrl: "",
      embedUrl: "",
      error: "",
      isEmpty: true,
      isValid: false,
      kind: "",
      mediaId: "",
      platform: "",
      platformLabel: "",
      url: "",
    };
  }

  let url;

  try {
    url = new URL(normalizedUrl);
  } catch {
    return {
      displayUrl: normalizedUrl,
      embedUrl: "",
      error: "Enter a valid reference URL.",
      isEmpty: false,
      isValid: false,
      kind: "",
      mediaId: "",
      platform: "",
      platformLabel: "",
      url: normalizedUrl,
    };
  }

  const hostname = getHostname(url);
  const normalizedHostname = hostname.replace(/^www\./, "");

  if (YOUTUBE_HOSTS.has(hostname) || YOUTUBE_HOSTS.has(normalizedHostname)) {
    const mediaId = getYouTubeId(url);

    return {
      displayUrl: url.href,
      embedUrl: mediaId ? `https://www.youtube.com/embed/${mediaId}` : "",
      error: mediaId ? "" : "This YouTube URL is missing a video ID.",
      isEmpty: false,
      isValid: Boolean(mediaId),
      kind: "video",
      mediaId,
      platform: "youtube",
      platformLabel: getPlatformLabel("youtube"),
      url: url.href,
    };
  }

  if (VIMEO_HOSTS.has(hostname) || VIMEO_HOSTS.has(normalizedHostname)) {
    const mediaId = getVimeoId(url);

    return {
      displayUrl: url.href,
      embedUrl: mediaId ? `https://player.vimeo.com/video/${mediaId}` : "",
      error: mediaId ? "" : "This Vimeo URL is missing a video ID.",
      isEmpty: false,
      isValid: Boolean(mediaId),
      kind: "video",
      mediaId,
      platform: "vimeo",
      platformLabel: getPlatformLabel("vimeo"),
      url: url.href,
    };
  }

  if (SPOTIFY_HOSTS.has(hostname) || SPOTIFY_HOSTS.has(normalizedHostname)) {
    const spotifyReference = getSpotifyReference(url);
    const isSupportedKind = ["album", "artist", "episode", "playlist", "show", "track"].includes(spotifyReference.kind);

    return {
      displayUrl: url.href,
      embedUrl: spotifyReference.mediaId && isSupportedKind ? `https://open.spotify.com/embed/${spotifyReference.kind}/${spotifyReference.mediaId}` : "",
      error: spotifyReference.mediaId && isSupportedKind ? "" : "This Spotify URL is not a supported track, album, playlist, episode, show, or artist URL.",
      isEmpty: false,
      isValid: Boolean(spotifyReference.mediaId && isSupportedKind),
      kind: spotifyReference.kind,
      mediaId: spotifyReference.mediaId,
      platform: "spotify",
      platformLabel: getPlatformLabel("spotify"),
      url: url.href,
    };
  }

  if (SOUNDCLOUD_HOSTS.has(hostname) || SOUNDCLOUD_HOSTS.has(normalizedHostname)) {
    const soundCloudReference = getSoundCloudReference(url);

    return {
      displayUrl: url.href,
      embedUrl: "",
      error: soundCloudReference.mediaId ? "" : "This SoundCloud URL is missing a track or profile path.",
      isEmpty: false,
      isValid: Boolean(soundCloudReference.mediaId),
      kind: soundCloudReference.kind,
      mediaId: soundCloudReference.mediaId,
      platform: "soundcloud",
      platformLabel: getPlatformLabel("soundcloud"),
      url: url.href,
    };
  }

  return {
    displayUrl: url.href,
    embedUrl: "",
    error: "",
    isEmpty: false,
    isValid: true,
    kind: "web",
    mediaId: "",
    platform: "generic",
    platformLabel: getPlatformLabel("generic"),
    url: url.href,
  };
}

function getReferenceTrackSummary(referenceTrack) {
  if (!referenceTrack?.isValid) return "";

  if (referenceTrack.platform === "generic") {
    return "Reference link saved.";
  }

  const kind = referenceTrack.kind ? `${referenceTrack.kind} ` : "";

  return `${referenceTrack.platformLabel} ${kind}reference saved.`;
}

export { getReferenceTrackSummary, parseReferenceTrackUrl };
