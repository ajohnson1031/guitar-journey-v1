import * as React from "react";
import { SessionHistory } from "../components";

const { Fragment } = React;

export default function HistoryRoute({ sessions }) {
  return (
    <Fragment>
      <SessionHistory sessions={sessions} />
    </Fragment>
  );
}
