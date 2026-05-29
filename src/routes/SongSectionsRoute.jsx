import * as React from "react";
import { SongSections } from "../components";

const { Fragment } = React;

export default function SongSectionsRoute({ selectedSong }) {
  return (
    <Fragment>
      <SongSections selectedSong={selectedSong} />
    </Fragment>
  );
}
