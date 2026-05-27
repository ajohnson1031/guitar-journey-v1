import * as React from "react";

const { useMemo, useState } = React;

function normalizeGenreName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export default function GenreManager({ builtInGenres, customGenres, songs, selectedPath, onAddGenre, onRemoveGenre }) {
  const [genreName, setGenreName] = useState("");
  const [message, setMessage] = useState("");

  const allGenreNames = useMemo(() => {
    return new Set([...builtInGenres, ...customGenres].map((genre) => genre.toLowerCase()));
  }, [builtInGenres, customGenres]);

  function getSongCountForGenre(genre) {
    return songs.filter((song) => song.genre === genre).length;
  }

  function handleAddGenre(event) {
    event.preventDefault();

    const nextGenre = normalizeGenreName(genreName);

    if (!nextGenre) {
      setMessage("Enter a genre name.");
      return;
    }

    if (allGenreNames.has(nextGenre.toLowerCase())) {
      setMessage("That genre already exists.");
      return;
    }

    onAddGenre(nextGenre);
    setGenreName("");
    setMessage("");
  }

  function handleRemoveGenre(genre) {
    const songCount = getSongCountForGenre(genre);

    if (songCount > 0) {
      setMessage(`Move or delete ${songCount} song${songCount === 1 ? "" : "s"} before removing ${genre}.`);
      return;
    }

    onRemoveGenre(genre);
    setMessage("");
  }

  return (
    <section className="panel-card genre-manager-card">
      <h2>Manage Genres</h2>

      <form className="genre-manager-form" onSubmit={handleAddGenre}>
        <input
          type="text"
          value={genreName}
          placeholder="Add genre..."
          onChange={(event) => {
            setGenreName(event.target.value);
            setMessage("");
          }}
        />

        <button type="submit" className="selected-button">
          Add
        </button>
      </form>

      {customGenres.length ? (
        <div className="custom-genre-list">
          {customGenres.map((genre) => {
            const songCount = getSongCountForGenre(genre);
            const isSelected = selectedPath === genre;

            return (
              <div key={genre} className={`custom-genre-row ${isSelected ? "is-active" : ""}`}>
                <div>
                  <strong>{genre}</strong>
                  <small>
                    {songCount} song{songCount === 1 ? "" : "s"}
                  </small>
                </div>

                <button
                  type="button"
                  className="danger-button genre-remove-button"
                  title={`Remove ${genre}`}
                  aria-label={`Remove ${genre}`}
                  onClick={() => handleRemoveGenre(genre)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="genre-manager-empty">No custom genres yet.</p>
      )}

      {message ? <p className="genre-manager-message">{message}</p> : null}
    </section>
  );
}
