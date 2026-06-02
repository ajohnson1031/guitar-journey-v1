import * as React from "react";
import { CurrentSongCard, LocalProgressCard, RequiredChords, TodayPlan } from "../components";
import { useGuitarJourneyContext } from "../context";

const { Fragment } = React;

export default function DashboardRoute() {
  const { dashboardRouteProps = {} } = useGuitarJourneyContext();

  const {
    actualPracticeMinutes,
    canCompleteSession,
    completedSteps,
    elapsedSessionSeconds,
    filteredSongs,
    hasPendingRecording,
    isSessionRecording,
    isSessionRecordingPaused,
    isSessionTimerRunning,
    localProgressProps = {},
    masteredSongs,
    onCompleteSession,
    onDeleteCustomSong,
    onPauseSessionRecording,
    onResetSessionTimer,
    onResumeSessionRecording,
    onSelectSong,
    onSessionMinutesChange,
    onSessionNotesChange,
    onSessionPracticedSectionChange,
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
    sessionNotes,
    sessionPracticedSection,
    sessionRating,
  } = dashboardRouteProps;

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

        <div className="dashboard-side-column">
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
            onSessionNotesChange={onSessionNotesChange}
            onSessionPracticedSectionChange={onSessionPracticedSectionChange}
            onSessionRatingChange={onSessionRatingChange}
            onToggleSessionRecording={onToggleSessionRecording}
            onToggleSessionTimer={onToggleSessionTimer}
            onToggleStep={onToggleStep}
            plan={plan}
            progressPercent={progressPercent}
            recordingDurationSeconds={recordingDurationSeconds}
            recordingInputLevel={recordingInputLevel}
            recordingMessage={recordingMessage}
            selectedSong={selectedSong}
            sessionHistory={sessionHistory}
            sessionMessage={sessionMessage}
            sessionMinutes={sessionMinutes}
            sessionNotes={sessionNotes}
            sessionPracticedSection={sessionPracticedSection}
            sessionRating={sessionRating}
          />

          <LocalProgressCard {...localProgressProps} />
        </div>
      </div>
    </Fragment>
  );
}
