import * as React from "react";
import { SessionHistory } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function HistoryRoute() {
  const { historyRouteProps = {} } = useGuitarJourneyContext();

  return (
    <Fragment>
      <SessionHistory {...historyRouteProps} />
    </Fragment>
  );
}
