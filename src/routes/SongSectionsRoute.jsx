import * as React from "react";
import { SongSections } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function SongSectionsRoute() {
  const { songSectionsRouteProps = {} } = useGuitarJourneyContext();
  const { selectedSong } = songSectionsRouteProps;

  return (
    <Fragment>
      <SongSections selectedSong={selectedSong} />
    </Fragment>
  );
}
