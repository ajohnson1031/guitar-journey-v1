import * as React from "react";
import { CurrentSongCard, RequiredChords, TodayPlan } from "../components";

const { Fragment } = React;

export default function DashboardRoute({
  actualPracticeMinutes,
  canCompleteSession,
  completedSteps,
  elapsedSessionSeconds,
  filteredSongs,
  hasPendingRecording,
  isSessionRecording,
  isSessionRecordingPaused,
  isSessionTimerRunning,
  masteredSongs,
  onCompleteSession,
  onDeleteCustomSong,
  onPauseSessionRecording,
  onResetSessionTimer,
  onResumeSessionRecording,
  onSelectSong,
  onSessionMinutesChange,
  onSessionRatingChange,
  onStartEditCustomSong,
  onToggleMastered,
  onToggleSessionRecording,
  onToggleSessionTimer,
  onToggleStep,
  plan,
  progressPercent,
  recordingDurationSeconds,
  recordingInputLevel,
  recordingMessage,
  selectedSong,
  sessionHistory,
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
          hasPendingRecording={hasPendingRecording}
          isSessionRecording={isSessionRecording}
          isSessionRecordingPaused={isSessionRecordingPaused}
          isSessionTimerRunning={isSessionTimerRunning}
          onCompleteSession={onCompleteSession}
          onPauseSessionRecording={onPauseSessionRecording}
          onResetSessionTimer={onResetSessionTimer}
          onResumeSessionRecording={onResumeSessionRecording}
          onSessionMinutesChange={onSessionMinutesChange}
          onSessionRatingChange={onSessionRatingChange}
          onToggleSessionRecording={onToggleSessionRecording}
          onToggleSessionTimer={onToggleSessionTimer}
          onToggleStep={onToggleStep}
          plan={plan}
          progressPercent={progressPercent}
          recordingDurationSeconds={recordingDurationSeconds}
          recordingInputLevel={recordingInputLevel}
          recordingMessage={recordingMessage}
          sessionHistory={sessionHistory}
          sessionMessage={sessionMessage}
          sessionMinutes={sessionMinutes}
          sessionRating={sessionRating}
        />
      </div>
    </Fragment>
  );
}
