import * as React from "react";
import { EditIcon, PencilOffIcon, PlusIcon, SaveIcon, TrashIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useMemo, useState } = React;

const MAX_GENRE_NAME_LENGTH = 32;
const MAX_GENRE_DESCRIPTION_LENGTH = 100;

function normalizeGenreName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeGenreDescription(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_GENRE_DESCRIPTION_LENGTH);
}

function getLimitedInputValue(value, maxLength) {
  return String(value || "").slice(0, maxLength);
}

export default function GenreManager({ builtInGenres, customGenres, songs, selectedPath, onAddGenre, onRemoveGenre, onUpdateGenre }) {
  const [genreName, setGenreName] = useState("");
  const [genreDescription, setGenreDescription] = useState("");
  const [editingGenreOriginalName, setEditingGenreOriginalName] = useState("");
  const [isGenreFormOpen, setIsGenreFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingDeleteGenre, setPendingDeleteGenre] = useState(null);

  const allGenreNames = useMemo(() => {
    return new Set([...builtInGenres.map((genre) => genre.toLowerCase()), ...customGenres.map((genre) => genre.name.toLowerCase())]);
  }, [builtInGenres, customGenres]);

  const editingGenre = useMemo(() => {
    if (!editingGenreOriginalName) return null;

    return customGenres.find((genre) => genre.name === editingGenreOriginalName) || null;
  }, [customGenres, editingGenreOriginalName]);

  const isEditingGenre = Boolean(editingGenre);

  function getSongCountForGenre(genre) {
    return songs.filter((song) => song.genre === genre).length;
  }

  function resetGenreForm() {
    setGenreName("");
    setGenreDescription("");
    setEditingGenreOriginalName("");
    setMessage("");
  }

  function closeGenreForm() {
    setIsGenreFormOpen(false);
    resetGenreForm();
  }

  function handleToggleAddGenreForm() {
    if (isGenreFormOpen) {
      closeGenreForm();
      return;
    }

    resetGenreForm();
    setIsGenreFormOpen(true);
  }

  function handleStartEditGenre(genre) {
    setGenreName(getLimitedInputValue(genre.name, MAX_GENRE_NAME_LENGTH));
    setGenreDescription(getLimitedInputValue(genre.description, MAX_GENRE_DESCRIPTION_LENGTH));
    setEditingGenreOriginalName(genre.name);
    setIsGenreFormOpen(true);
    setMessage("");
  }

  function validateGenreName(nextGenreName, originalGenreName = "") {
    const nextGenreKey = nextGenreName.toLowerCase();
    const originalGenreKey = originalGenreName.toLowerCase();

    if (!nextGenreName) {
      setMessage("Enter a genre name.");
      return false;
    }

    if (nextGenreName.length > MAX_GENRE_NAME_LENGTH) {
      setMessage(`Genre names must be ${MAX_GENRE_NAME_LENGTH} characters or fewer.`);
      return false;
    }

    if (nextGenreKey !== originalGenreKey && allGenreNames.has(nextGenreKey)) {
      setMessage("That genre already exists.");
      return false;
    }

    return true;
  }

  function handleAddGenre(event) {
    event.preventDefault();

    const nextGenreName = normalizeGenreName(genreName);

    if (!validateGenreName(nextGenreName)) return;

    onAddGenre({
      name: nextGenreName,
      description: normalizeGenreDescription(genreDescription),
    });

    closeGenreForm();
  }

  function handleSaveGenre(event) {
    event.preventDefault();

    if (!editingGenre) return;

    const nextGenreName = normalizeGenreName(genreName);

    if (!validateGenreName(nextGenreName, editingGenre.name)) return;

    onUpdateGenre({
      originalName: editingGenre.name,
      name: nextGenreName,
      description: normalizeGenreDescription(genreDescription),
    });

    closeGenreForm();
  }

  function handleRequestRemoveGenre(genre) {
    const songCount = getSongCountForGenre(genre.name);

    if (songCount > 0) {
      setMessage(`Move or delete ${songCount} song${songCount === 1 ? "" : "s"} before removing ${genre.name}.`);
      return;
    }

    setPendingDeleteGenre(genre);
    setMessage("");
  }

  function handleRequestRemoveEditingGenre() {
    if (!editingGenre) return;

    handleRequestRemoveGenre(editingGenre);
  }

  function handleCancelRemoveGenre() {
    setPendingDeleteGenre(null);
  }

  function handleConfirmRemoveGenre() {
    if (!pendingDeleteGenre) return;

    onRemoveGenre(pendingDeleteGenre.name);
    setPendingDeleteGenre(null);

    if (editingGenreOriginalName === pendingDeleteGenre.name) {
      closeGenreForm();
      return;
    }

    setMessage("");
  }

  return (
    <Fragment>
      <section className="panel-card genre-manager-card">
        <div className="genre-manager-header">
          <h2>Manage Genres</h2>

          <button
            type="button"
            className={`genre-add-toggle-button ${isGenreFormOpen ? "is-open" : ""}`}
            title={isGenreFormOpen ? "Hide Genre Form" : "Add Genre"}
            aria-label={isGenreFormOpen ? "Hide Genre Form" : "Add Genre"}
            aria-expanded={isGenreFormOpen}
            onClick={handleToggleAddGenreForm}
          >
            <PlusIcon />
          </button>
        </div>

        {customGenres.length ? (
          <div className="custom-genre-list">
            {customGenres.map((genre) => {
              const songCount = getSongCountForGenre(genre.name);
              const isSelected = selectedPath === genre.name;
              const isBeingEdited = editingGenreOriginalName === genre.name;

              return (
                <div key={genre.name} className={`custom-genre-row ${isSelected ? "is-active" : ""} ${isBeingEdited ? "is-editing" : ""}`}>
                  <div className="custom-genre-content">
                    <div className="custom-genre-header">
                      <div className="custom-genre-title">
                        <strong>{genre.name}</strong>
                        <small>
                          {songCount} song{songCount === 1 ? "" : "s"}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="ghost-button genre-icon-button genre-edit-button"
                        title={`Edit ${genre.name}`}
                        aria-label={`Edit ${genre.name}`}
                        onClick={() => handleStartEditGenre(genre)}
                      >
                        <EditIcon />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="genre-manager-empty">No custom genres yet.</p>
        )}

        {isGenreFormOpen ? (
          <form className="genre-manager-form" onSubmit={isEditingGenre ? handleSaveGenre : handleAddGenre}>
            <input
              type="text"
              value={genreName}
              maxLength={MAX_GENRE_NAME_LENGTH}
              placeholder="Genre name..."
              onChange={(event) => {
                setGenreName(getLimitedInputValue(event.target.value, MAX_GENRE_NAME_LENGTH));
                setMessage("");
              }}
            />

            <textarea
              value={genreDescription}
              maxLength={MAX_GENRE_DESCRIPTION_LENGTH}
              placeholder={`Genre description (${MAX_GENRE_DESCRIPTION_LENGTH} chars max)...`}
              rows="3"
              onChange={(event) => {
                setGenreDescription(getLimitedInputValue(event.target.value, MAX_GENRE_DESCRIPTION_LENGTH));
                setMessage("");
              }}
            />

            {isEditingGenre ? (
              <div className="genre-form-actions">
                <button
                  type="button"
                  className="ghost-button genre-form-action-button genre-cancel-edit-button"
                  title="Cancel edit"
                  aria-label={`Cancel editing ${editingGenre.name}`}
                  onClick={closeGenreForm}
                >
                  <PencilOffIcon />
                </button>

                <button type="submit" className="selected-button genre-form-action-button" title="Save genre" aria-label={`Save ${editingGenre.name}`}>
                  <SaveIcon />
                </button>

                <button
                  type="button"
                  className="danger-button genre-form-action-button genre-delete-button"
                  title={`Remove ${editingGenre.name}`}
                  aria-label={`Remove ${editingGenre.name}`}
                  onClick={handleRequestRemoveEditingGenre}
                >
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <button type="submit" className="selected-button genre-add-submit-button">
                Add Genre
              </button>
            )}

            <small className="genre-description-count">
              {genreDescription.length}/{MAX_GENRE_DESCRIPTION_LENGTH}
            </small>
          </form>
        ) : null}

        {message ? <p className="genre-manager-message">{message}</p> : null}
      </section>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteGenre)}
        title="Delete custom genre?"
        message={pendingDeleteGenre ? `Delete “${pendingDeleteGenre.name}”? This removes the custom genre from this device.` : ""}
        confirmLabel="Delete Genre"
        cancelLabel="Keep Genre"
        tone="danger"
        onCancel={handleCancelRemoveGenre}
        onConfirm={handleConfirmRemoveGenre}
      />
    </Fragment>
  );
}
