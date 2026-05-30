Session stop confirmation patch

Replace:
- src/components/TodayPlan.jsx

What changed:
- Stop no longer immediately resets the active session.
- Clicking Stop pauses the session timer while the user decides.
- If a recording is active, clicking Stop also pauses the recording while the dialog is open.
- Cancel closes the dialog and resumes the session.
- Cancel resumes the recording if the Stop action paused it.
- Discard Session runs the existing reset/stop behavior, including discarding unsaved recordings.
- Stop button title/aria-label is updated to "Stop and Discard Session".
