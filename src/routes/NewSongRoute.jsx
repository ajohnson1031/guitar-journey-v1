import * as React from "react";
import { CustomSongForm } from "../components";

const { Fragment } = React;

export default function NewSongRoute({
  genres,
  onAddSong,
  onCancelEdit,
  onClose,
  onUpdateSong,
}) {
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
