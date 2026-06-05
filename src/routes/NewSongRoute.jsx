import * as React from "react";
import { useLocation } from "react-router-dom";
import { CustomSongForm } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function NewSongRoute() {
  const location = useLocation();
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
        initialSongDraft={location.state?.draftSong || null}
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
