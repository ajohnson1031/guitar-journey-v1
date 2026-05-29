import * as React from "react";
import { CurrentSongCard, RequiredChords, TodayPlan } from "../components";

const { Fragment } = React;

export default function DashboardRoute({
  actualPracticeMinutes,
  canCompleteSession,
  completedSteps,
  elapsedSessionSeconds,
  filteredSongs,
  isSessionTimerRunning,
  masteredSongs,
  onCompleteSession,
  onDeleteCustomSong,
  onResetSessionTimer,
  onSelectSong,
  onSessionMinutesChange,
  onSessionRatingChange,
  onStartEditCustomSong,
  onToggleMastered,
  onToggleSessionTimer,
  onToggleStep,
  plan,
  progressPercent,
  selectedSong,
  sessionMessage,
  sessionMinutes,
  sessionRating,
}) {
  return (
    <Fragment>
      <div className="top-grid dashboard-top-grid">
        <div className="song-column">
          <CurrentSongCard
            filteredSongs={filteredSongs}
            masteredSongs={masteredSongs}
            onDeleteCustomSong={onDeleteCustomSong}
            onSelectSong={onSelectSong}
            onStartEditCustomSong={onStartEditCustomSong}
            onToggleMastered={onToggleMastered}
            selectedSong={selectedSong}
          />

          <RequiredChords selectedSong={selectedSong} />
        </div>

        <TodayPlan
          actualPracticeMinutes={actualPracticeMinutes}
          canCompleteSession={canCompleteSession}
          completedSteps={completedSteps}
          elapsedSessionSeconds={elapsedSessionSeconds}
          isSessionTimerRunning={isSessionTimerRunning}
          onCompleteSession={onCompleteSession}
          onResetSessionTimer={onResetSessionTimer}
          onSessionMinutesChange={onSessionMinutesChange}
          onSessionRatingChange={onSessionRatingChange}
          onToggleSessionTimer={onToggleSessionTimer}
          onToggleStep={onToggleStep}
          plan={plan}
          progressPercent={progressPercent}
          sessionMessage={sessionMessage}
          sessionMinutes={sessionMinutes}
          sessionRating={sessionRating}
        />
      </div>
    </Fragment>
  );
}
