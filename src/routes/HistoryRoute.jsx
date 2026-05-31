import * as React from "react";
import { SessionHistory } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function HistoryRoute() {
  const { historyRouteProps = {} } = useGuitarJourneyContext();
  const { onDeleteSessionRecording, sessions } = historyRouteProps;

  return (
    <Fragment>
      <SessionHistory onDeleteSessionRecording={onDeleteSessionRecording} sessions={sessions} />
    </Fragment>
  );
}
