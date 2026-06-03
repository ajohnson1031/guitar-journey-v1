import * as React from "react";
import { Navigate, useParams } from "react-router-dom";
import { CustomSongForm } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment, useMemo } = React;

const noop = () => {};

export default function EditSongRoute() {
  const {
    editSongRouteProps = {},
    sidebarProps = {},
  } = useGuitarJourneyContext();

  const {
    customSongs = [],
    existingSongs = sidebarProps.allSongs || customSongs,
    genres,
    onCancelEdit,
    onClose,
    onUpdateSong,
  } = editSongRouteProps;

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
        existingSongs={existingSongs}
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
