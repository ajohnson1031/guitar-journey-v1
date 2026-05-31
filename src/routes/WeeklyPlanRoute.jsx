import * as React from "react";
import { WeeklyPlan } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function WeeklyPlanRoute() {
  const { weeklyPlanRouteProps = {} } = useGuitarJourneyContext();

  const {
    masteredSongs,
    selectedSong,
    sessionHistory,
    sessionMinutes,
    transitionScores,
  } = weeklyPlanRouteProps;

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
