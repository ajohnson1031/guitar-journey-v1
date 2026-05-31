import * as React from "react";
import { CustomSongForm } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function NewSongRoute() {
  const { newSongRouteProps = {} } = useGuitarJourneyContext();

  const {
    genres,
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
        genres={genres}
        showToggle={false}
        onAddSong={onAddSong}
        onCancelEdit={onCancelEdit}
        onClose={onClose}
        onUpdateSong={onUpdateSong}
      />
    </Fragment>
  );
}
