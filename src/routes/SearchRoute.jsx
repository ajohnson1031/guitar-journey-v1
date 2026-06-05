import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SiSoundcloud, SiSpotify, SiVimeo, SiYoutube } from "react-icons/si";
import { useGuitarJourneyContext } from "../context";
import { ExternalLinkIcon, PlusIcon } from "../components/AppIcons";
import { parseReferenceTrackUrl } from "../utils/referenceTrackUtils";
import { getArtistById, getPaginatedItems, searchArtists, searchSongs } from "../utils/searchCatalogUtils";

const { Fragment, useMemo } = React;

const REFERENCE_SERVICE_LOGOS = {
  generic: {
    Icon: ExternalLinkIcon,
    className: "is-generic",
    label: "Reference",
  },
  soundcloud: {
    Icon: SiSoundcloud,
    className: "is-soundcloud",
    label: "SoundCloud",
  },
  spotify: {
    Icon: SiSpotify,
    className: "is-spotify",
    label: "Spotify",
  },
  vimeo: {
    Icon: SiVimeo,
    className: "is-vimeo",
    label: "Vimeo",
  },
  youtube: {
    Icon: SiYoutube,
    className: "is-youtube",
    label: "YouTube",
  },
};

function ReferenceServiceLogo({ platform, platformLabel }) {
  const config = REFERENCE_SERVICE_LOGOS[platform] || REFERENCE_SERVICE_LOGOS.generic;
  const Icon = config.Icon;
  const label = platformLabel || config.label;

  return (
    <span className={`search-result-thumbnail search-service-logo is-large ${config.className}`} aria-label={`${label} reference`} title={label}>
      <Icon aria-hidden="true" focusable="false" />
    </span>
  );
}

function getCreatePracticeStateFromSong(song) {
  return {
    draftSong: {
      artist: song.artist === "Guitar Journey" ? "" : song.artist,
      sourceUrl: song.sourceUrl || "",
      title: song.title,
      referenceTrack: song.referenceTrack || null,
    },
  };
}

function getCreatePracticeStateFromReference(referenceTrack) {
  return {
    draftSong: {
      artist: "",
      sourceUrl: referenceTrack.url,
      title: "",
      referenceTrack: {
        embedUrl: referenceTrack.embedUrl,
        kind: referenceTrack.kind,
        mediaId: referenceTrack.mediaId,
        platform: referenceTrack.platform,
        platformLabel: referenceTrack.platformLabel,
        url: referenceTrack.url,
      },
    },
  };
}

export default function SearchRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    sidebarProps = {},
  } = useGuitarJourneyContext();

  const allSongs = sidebarProps.allSongs || [];
  const query = searchParams.get("q") || "";
  const url = searchParams.get("url") || "";
  const artistId = searchParams.get("artistId") || "";
  const page = Number(searchParams.get("page") || 1);

  const referenceTrack = useMemo(() => parseReferenceTrackUrl(url), [url]);
  const artistResults = useMemo(() => searchArtists(query, allSongs), [allSongs, query]);
  const songResults = useMemo(() => searchSongs(query, allSongs), [allSongs, query]);
  const selectedArtist = useMemo(() => getArtistById(artistId, allSongs), [allSongs, artistId]);
  const paginatedArtistSongs = useMemo(() => getPaginatedItems(selectedArtist?.songs || [], page), [page, selectedArtist]);

  function handleCreatePracticeFromSong(song) {
    navigate("/songs/new", {
      state: getCreatePracticeStateFromSong(song),
    });
  }

  function handleCreatePracticeFromReference() {
    if (!referenceTrack.isValid) return;

    navigate("/songs/new", {
      state: getCreatePracticeStateFromReference(referenceTrack),
    });
  }

  return (
    <Fragment>
      <section className="panel-card search-results-page">
        <div className="search-results-header">
          <p className="eyebrow">Find music</p>
          <h1>{url ? "Reference Link" : selectedArtist ? selectedArtist.name : "Search Results"}</h1>
          <p>
            {url
              ? "Review the detected reference before creating a practice setup."
              : "Search your current catalog by song title, artist, or pasted reference link. External catalog integration comes later."}
          </p>
        </div>

        {url ? (
          <ReferenceReviewCard referenceTrack={referenceTrack} onCreatePractice={handleCreatePracticeFromReference} />
        ) : selectedArtist ? (
          <ArtistSongList artist={selectedArtist} paginatedSongs={paginatedArtistSongs} query={query} />
        ) : query ? (
          <div className="search-results-layout">
            <section className="search-result-section">
              <div className="search-result-section-header">
                <h2>Artists</h2>
                <span>{artistResults.length} found</span>
              </div>

              {artistResults.length ? (
                <div className="artist-result-grid">
                  {artistResults.map((artist) => (
                    <Link key={artist.id} className="artist-result-card" to={`/search?q=${encodeURIComponent(query)}&artistId=${encodeURIComponent(artist.id)}&page=1`}>
                      <span className="search-result-thumbnail">{artist.initials}</span>
                      <strong>{artist.name}</strong>
                      <small>{artist.songCount} songs</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySearchState message="No matching artists yet." />
              )}
            </section>

            <section className="search-result-section">
              <div className="search-result-section-header">
                <h2>Songs</h2>
                <span>{songResults.length} found</span>
              </div>

              {songResults.length ? (
                <div className="song-result-list">
                  {songResults.map((song) => (
                    <SongResultCard key={song.id} song={song} onCreatePractice={() => handleCreatePracticeFromSong(song)} />
                  ))}
                </div>
              ) : (
                <EmptySearchState message="No matching songs yet." />
              )}
            </section>
          </div>
        ) : (
          <EmptySearchState message="Search for a song, artist, or paste a reference link from the navbar." />
        )}
      </section>
    </Fragment>
  );
}

function ReferenceReviewCard({ onCreatePractice, referenceTrack }) {
  if (!referenceTrack.isValid) {
    return (
      <div className="reference-review-card is-warning">
        <strong>Reference could not be used yet.</strong>
        <p>{referenceTrack.error || "Paste a valid YouTube, Vimeo, Spotify, SoundCloud, or web link."}</p>
      </div>
    );
  }

  return (
    <div className="reference-review-card">
      <ReferenceServiceLogo platform={referenceTrack.platform} platformLabel={referenceTrack.platformLabel} />

      <div>
        <p className="eyebrow">{referenceTrack.platformLabel}</p>
        <h2>{referenceTrack.kind ? `${referenceTrack.kind} reference detected` : "Reference detected"}</h2>
        <p>{referenceTrack.url}</p>
      </div>

      <div className="search-result-actions">
        <a className="icon-button" href={referenceTrack.url} target="_blank" rel="noreferrer" aria-label="Open reference link" title="Open reference link">
          <ExternalLinkIcon />
        </a>

        <button type="button" className="complete-session-button search-create-button" onClick={onCreatePractice}>
          <PlusIcon />
          <span>Set Up Practice</span>
        </button>
      </div>
    </div>
  );
}

function ArtistSongList({ artist, paginatedSongs, query }) {
  return (
    <section className="search-result-section">
      <div className="artist-detail-header">
        <span className="search-result-thumbnail is-large">{artist.initials}</span>
        <div>
          <p className="eyebrow">Artist / Group</p>
          <h2>{artist.name}</h2>
          <p>{artist.songCount} listed songs</p>
        </div>
      </div>

      <div className="song-result-list">
        {paginatedSongs.items.map((song) => (
          <SongResultCard key={song.id} song={song} />
        ))}
      </div>

      {paginatedSongs.totalPages > 1 ? (
        <div className="search-pagination">
          {Array.from({ length: paginatedSongs.totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              className={`preset-button ${pageNumber === paginatedSongs.currentPage ? "is-selected" : ""}`}
              to={`/search?q=${encodeURIComponent(query)}&artistId=${encodeURIComponent(artist.id)}&page=${pageNumber}`}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SongResultCard({ onCreatePractice, song }) {
  const hasExternalLink = Boolean(song.sourceUrl);

  return (
    <article className="song-result-card">
      <span className="search-result-thumbnail">{song.thumbnailText}</span>

      <div className="song-result-copy">
        <strong>{song.title}</strong>
        <span>{song.artist}</span>
        <small>
          {song.recordCompany || "Record company not listed"} · {song.publishDate || "Publish date not listed"}
        </small>
      </div>

      <div className="search-result-actions">
        {hasExternalLink ? (
          <a className="icon-button" href={song.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${song.title}`} title={`Open ${song.title}`}>
            <ExternalLinkIcon />
          </a>
        ) : (
          <button type="button" className="icon-button" aria-label="No external link available" title="No external link available" disabled>
            <ExternalLinkIcon />
          </button>
        )}

        {onCreatePractice ? (
          <button type="button" className="complete-session-button search-create-button" onClick={onCreatePractice}>
            <PlusIcon />
            <span>Set Up Practice</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

function EmptySearchState({ message }) {
  return (
    <div className="empty-search-state">
      <strong>{message}</strong>
      <p>External music provider search is intentionally stubbed for now; this view is wired for the next provider-backed step.</p>
    </div>
  );
}
