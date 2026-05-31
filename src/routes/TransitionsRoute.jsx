import * as React from "react";
import { TransitionTracker } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function TransitionsRoute() {
  const { transitionsRouteProps = {} } = useGuitarJourneyContext();
  const { onUpdateTransitionScore, selectedSong, transitionScores } = transitionsRouteProps;

  return (
    <Fragment>
      <TransitionTracker
        selectedSong={selectedSong}
        transitionScores={transitionScores}
        onUpdateTransitionScore={onUpdateTransitionScore}
      />
    </Fragment>
  );
}
