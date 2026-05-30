import * as React from "react";
import { SessionHistory } from "../components";

const { Fragment } = React;

export default function HistoryRoute({ onDeleteSessionRecording, sessions }) {
  return (
    <Fragment>
      <SessionHistory onDeleteSessionRecording={onDeleteSessionRecording} sessions={sessions} />
    </Fragment>
  );
}
