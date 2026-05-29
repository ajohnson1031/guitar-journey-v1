import * as React from "react";
import { TransitionTracker } from "../components";

const { Fragment } = React;

export default function TransitionsRoute({ onUpdateTransitionScore, selectedSong, transitionScores }) {
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
