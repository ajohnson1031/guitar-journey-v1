import * as React from "react";

const { useMemo, useState } = React;

function normalizeGenreName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export default function GenreManager({ builtInGenres, customGenres, songs, selectedPath, onAddGenre, onRemoveGenre, onUpdateGenre }) {
  const [genreName, setGenreName] = useState("");
  const [genreDescription, setGenreDescription] = useState("");
  const [editingGenreName, setEditingGenreName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [message, setMessage] = useState("");

  const allGenreNames = useMemo(() => {
    return new Set([...builtInGenres.map((genre) => genre.toLowerCase()), ...customGenres.map((genre) => genre.name.toLowerCase())]);
  }, [builtInGenres, customGenres]);

  function getSongCountForGenre(genre) {
    return songs.filter((song) => song.genre === genre).length;
  }

  function handleAddGenre(event) {
    event.preventDefault();

    const nextGenreName = normalizeGenreName(genreName);

    if (!nextGenreName) {
      setMessage("Enter a genre name.");
      return;
    }

    if (allGenreNames.has(nextGenreName.toLowerCase())) {
      setMessage("That genre already exists.");
      return;
    }

    onAddGenre({
      name: nextGenreName,
      description: genreDescription.trim(),
    });

    setGenreName("");
    setGenreDescription("");
    setMessage("");
  }

  function handleStartEditGenre(genre) {
    setEditingGenreName(genre.name);
    setEditingDescription(genre.description || "");
    setMessage("");
  }

  function handleCancelEditGenre() {
    setEditingGenreName("");
    setEditingDescription("");
    setMessage("");
  }

  function handleSaveGenreDescription(genre) {
    onUpdateGenre({
      name: genre.name,
      description: editingDescription.trim(),
    });

    setEditingGenreName("");
    setEditingDescription("");
    setMessage("");
  }

  function handleRemoveGenre(genre) {
    const songCount = getSongCountForGenre(genre.name);

    if (songCount > 0) {
      setMessage(`Move or delete ${songCount} song${songCount === 1 ? "" : "s"} before removing ${genre.name}.`);
      return;
    }

    onRemoveGenre(genre.name);
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

        <textarea
          value={genreDescription}
          placeholder="Genre description..."
          rows="3"
          onChange={(event) => {
            setGenreDescription(event.target.value);
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
            const songCount = getSongCountForGenre(genre.name);
            const isSelected = selectedPath === genre.name;
            const isEditing = editingGenreName === genre.name;

            return (
              <div key={genre.name} className={`custom-genre-row ${isSelected ? "is-active" : ""} ${isEditing ? "is-editing" : ""}`}>
                <div className="custom-genre-content">
                  <strong>{genre.name}</strong>

                  {isEditing ? (
                    <textarea value={editingDescription} rows="3" placeholder="Genre description..." onChange={(event) => setEditingDescription(event.target.value)} />
                  ) : (
                    <p>{genre.description}</p>
                  )}

                  <div className="custom-genre-footer">
                    <small>
                      {songCount} song{songCount === 1 ? "" : "s"}
                    </small>

                    <div className="custom-genre-actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="ghost-button genre-action-button" onClick={handleCancelEditGenre}>
                            Cancel
                          </button>

                          <button type="button" className="selected-button genre-action-button" onClick={() => handleSaveGenreDescription(genre)}>
                            Save
                          </button>
                        </>
                      ) : (
                        <button type="button" className="ghost-button genre-action-button" onClick={() => handleStartEditGenre(genre)}>
                          Edit
                        </button>
                      )}

                      <button
                        type="button"
                        className="danger-button genre-remove-button"
                        title={`Remove ${genre.name}`}
                        aria-label={`Remove ${genre.name}`}
                        onClick={() => handleRemoveGenre(genre)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
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
