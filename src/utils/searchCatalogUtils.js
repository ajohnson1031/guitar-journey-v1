import { parseReferenceTrackUrl } from "./referenceTrackUtils";
import { slugify } from "./songFormUtils";

const RESULTS_PER_PAGE = 20;

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function getSongArtist(song) {
  return String(song?.artist || "").trim() || "Guitar Journey";
}

function getArtistId(artistName) {
  return slugify(artistName || "unknown-artist") || "unknown-artist";
}

function getInitials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "GJ";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getSongReferenceUrl(song) {
  return song?.referenceTrack?.url || song?.sourceUrl || "";
}

function normalizeCatalogSong(song) {
  const artist = getSongArtist(song);
  const artistId = getArtistId(artist);
  const sourceUrl = getSongReferenceUrl(song);

  return {
    artist,
    artistId,
    artistInitials: getInitials(artist),
    genre: song.genre || "",
    id: song.id,
    publishDate: song.publishDate || song.releaseDate || "",
    recordCompany: song.recordCompany || song.label || "",
    referenceTrack: song.referenceTrack || null,
    sourceUrl,
    thumbnailText: getInitials(song.title || artist),
    title: song.title || "Untitled Song",
  };
}

function buildArtistCatalog(songs = []) {
  const artistsById = new Map();

  songs.forEach((song) => {
    const normalizedSong = normalizeCatalogSong(song);

    if (!artistsById.has(normalizedSong.artistId)) {
      artistsById.set(normalizedSong.artistId, {
        id: normalizedSong.artistId,
        initials: normalizedSong.artistInitials,
        name: normalizedSong.artist,
        songCount: 0,
        songs: [],
      });
    }

    const artist = artistsById.get(normalizedSong.artistId);

    artist.songCount += 1;
    artist.songs.push(normalizedSong);
  });

  return Array.from(artistsById.values()).sort((artistA, artistB) => artistA.name.localeCompare(artistB.name));
}

function searchArtists(query, songs = []) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  return buildArtistCatalog(songs).filter((artist) => normalizeSearchText(artist.name).includes(normalizedQuery));
}

function searchSongs(query, songs = []) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  return songs
    .map(normalizeCatalogSong)
    .filter((song) => {
      const haystack = normalizeSearchText(`${song.title} ${song.artist} ${song.genre}`);

      return haystack.includes(normalizedQuery);
    })
    .sort((songA, songB) => songA.title.localeCompare(songB.title));
}

function getArtistById(artistId, songs = []) {
  return buildArtistCatalog(songs).find((artist) => artist.id === artistId) || null;
}

function getPaginatedItems(items = [], page = 1, perPage = RESULTS_PER_PAGE) {
  const safePage = Math.max(1, Number(page) || 1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * perPage;

  return {
    currentPage,
    items: items.slice(startIndex, startIndex + perPage),
    perPage,
    totalItems,
    totalPages,
  };
}

function getSearchMode(input) {
  const parsedReference = parseReferenceTrackUrl(input);

  if (parsedReference.isValid && !parsedReference.isEmpty) {
    return "url";
  }

  return "query";
}

export {
  RESULTS_PER_PAGE,
  buildArtistCatalog,
  getArtistById,
  getPaginatedItems,
  getSearchMode,
  normalizeCatalogSong,
  normalizeSearchText,
  searchArtists,
  searchSongs,
};
