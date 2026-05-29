import * as React from "react";
import { Navigate, useParams } from "react-router-dom";
import { CustomSongForm } from "../components";

const { Fragment, useMemo } = React;

const noop = () => {};

export default function EditSongRoute({
  customSongs,
  genres,
  onCancelEdit,
  onClose,
  onUpdateSong,
}) {
  const { songId } = useParams();

  const songToEdit = useMemo(() => {
    return customSongs.find((song) => song.id === songId) || null;
  }, [customSongs, songId]);

  if (!songToEdit) {
    return <Navigate to="/" replace />;
  }

  return (
    <Fragment>
      <CustomSongForm
        defaultOpen
        editingSong={songToEdit}
        genres={genres}
        showToggle={false}
        onAddSong={noop}
        onCancelEdit={onCancelEdit}
        onClose={onClose}
        onUpdateSong={onUpdateSong}
      />
    </Fragment>
  );
}
