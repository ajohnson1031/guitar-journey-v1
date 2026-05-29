import * as React from "react";
import { WeeklyPlan } from "../components";

const { Fragment } = React;

export default function WeeklyPlanRoute({
  masteredSongs,
  selectedSong,
  sessionHistory,
  sessionMinutes,
  transitionScores,
}) {
  return (
    <Fragment>
      <WeeklyPlan
        masteredSongs={masteredSongs}
        selectedSong={selectedSong}
        sessionHistory={sessionHistory}
        sessionMinutes={sessionMinutes}
        transitionScores={transitionScores}
      />
    </Fragment>
  );
}
