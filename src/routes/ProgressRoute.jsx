import * as React from "react";
import { ProgressLibrary } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function ProgressRoute() {
  const { progressRouteProps = {} } = useGuitarJourneyContext();

  return (
    <Fragment>
      <ProgressLibrary {...progressRouteProps} />
    </Fragment>
  );
}
