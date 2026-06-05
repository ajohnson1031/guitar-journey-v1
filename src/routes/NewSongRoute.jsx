import * as React from "react";
import { CustomSongForm } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function NewSongRoute() {
  const {
    newSongRouteProps = {},
    sidebarProps = {},
  } = useGuitarJourneyContext();

  const {
    existingSongs = sidebarProps.allSongs || [],
    genres,
    onAddGenre = sidebarProps.onAddGenre,
    onAddSong,
    onCancelEdit,
    onClose,
    onUpdateSong,
  } = newSongRouteProps;

  return (
    <Fragment>
      <CustomSongForm
        defaultOpen
        editingSong={null}
        existingSongs={existingSongs}
        genres={genres}
        showToggle={false}
        onAddGenre={onAddGenre}
        onAddSong={onAddSong}
        onCancelEdit={onCancelEdit}
        onClose={onClose}
        onUpdateSong={onUpdateSong}
      />
    </Fragment>
  );
}
