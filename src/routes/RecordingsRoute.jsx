import * as React from "react";
import { RecordingsLibrary } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function RecordingsRoute() {
  const { historyRouteProps = {} } = useGuitarJourneyContext();

  return (
    <Fragment>
      <RecordingsLibrary sessions={historyRouteProps.sessions || []} />
    </Fragment>
  );
}
