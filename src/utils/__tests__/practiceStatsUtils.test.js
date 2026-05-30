import { describe, expect, it } from "vitest";
import {
  formatPracticeMinutes,
  formatSessionActualDuration,
  getAverageRatingLabel,
  getCurrentStreak,
  getDateKey,
  getLongestStreak,
  getPracticeDayGroups,
  getPracticeHistoryStats,
  getSessionActualMinutes,
  getThisWeekMinutes,
  getTodayPracticeSummary,
} from "../practiceStatsUtils";

function createSession(overrides = {}) {
  return {
    id: "session-test",
    songId: "song-test",
    songTitle: "Test Song",
    plannedMinutes: 20,
    minutes: 20,
    elapsedSeconds: 1200,
    rating: "Okay",
    completedStepCount: 3,
    totalStepCount: 5,
    completedAt: "2026-05-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("practiceStatsUtils", () => {
  it("formats practice minutes", () => {
    expect(formatPracticeMinutes(0)).toBe("0m");
    expect(formatPracticeMinutes(42)).toBe("42m");
    expect(formatPracticeMinutes(60)).toBe("1h");
    expect(formatPracticeMinutes(95)).toBe("1h 35m");
  });

  it("formats session actual duration from seconds", () => {
    expect(formatSessionActualDuration(2, 20)).toBe("2s");
    expect(formatSessionActualDuration(120, 20)).toBe("2 min");
    expect(formatSessionActualDuration(125, 20)).toBe("2m 5s");
    expect(formatSessionActualDuration(0, 20)).toBe("20 min");
  });

  it("gets session minutes with elapsed fallback", () => {
    expect(getSessionActualMinutes(createSession({ minutes: 25 }))).toBe(25);
    expect(getSessionActualMinutes(createSession({ minutes: undefined, elapsedSeconds: 61 }))).toBe(2);
    expect(getSessionActualMinutes(createSession({ minutes: undefined, elapsedSeconds: 0 }))).toBe(0);
  });

  it("returns empty stats when there are no sessions", () => {
    const stats = getPracticeHistoryStats([], {
      referenceDate: new Date("2026-05-30T12:00:00"),
    });

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.totalPracticeLabel).toBe("0m");
    expect(stats.averageMinutes).toBe(0);
    expect(stats.averagePracticeLabel).toBe("0m");
    expect(stats.averageRating).toBe("—");
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.lastPracticedLabel).toBe("No sessions yet");
    expect(stats.thisWeekMinutes).toBe(0);
    expect(stats.todaySessionCount).toBe(0);
    expect(stats.todayMinutes).toBe(0);
    expect(stats.todayPracticeLabel).toBe("0m");
  });

  it("calculates total, average, this week, and last practiced stats", () => {
    const sessions = [
      createSession({
        id: "session-1",
        minutes: 30,
        completedAt: "2026-05-24T12:00:00",
      }),
      createSession({
        id: "session-2",
        minutes: 45,
        completedAt: "2026-05-26T12:00:00",
      }),
      createSession({
        id: "session-3",
        minutes: 15,
        completedAt: "2026-05-30T12:00:00",
      }),
      createSession({
        id: "session-old",
        minutes: 99,
        completedAt: "2026-05-17T12:00:00",
      }),
    ];

    const stats = getPracticeHistoryStats(sessions, {
      referenceDate: new Date("2026-05-30T15:00:00"),
    });

    expect(stats.totalSessions).toBe(4);
    expect(stats.totalMinutes).toBe(189);
    expect(stats.totalPracticeLabel).toBe("3h 9m");
    expect(stats.averageMinutes).toBe(47);
    expect(stats.averagePracticeLabel).toBe("47m");
    expect(stats.thisWeekMinutes).toBe(90);
    expect(stats.thisWeekPracticeLabel).toBe("1h 30m");
    expect(stats.todaySessionCount).toBe(1);
    expect(stats.todayMinutes).toBe(15);
    expect(stats.todayPracticeLabel).toBe("15m");
    expect(getDateKey(stats.lastPracticedDate)).toBe("2026-05-30");
  });

  it("calculates current streak from today", () => {
    const dateKeys = ["2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30"];

    expect(getCurrentStreak(dateKeys, new Date("2026-05-30T12:00:00"))).toBe(4);
  });

  it("keeps the current streak alive when the last practice was yesterday", () => {
    const dateKeys = ["2026-05-27", "2026-05-28", "2026-05-29"];

    expect(getCurrentStreak(dateKeys, new Date("2026-05-30T12:00:00"))).toBe(3);
  });

  it("resets current streak when the most recent practice is stale", () => {
    const dateKeys = ["2026-05-25", "2026-05-26", "2026-05-27"];

    expect(getCurrentStreak(dateKeys, new Date("2026-05-30T12:00:00"))).toBe(0);
  });

  it("counts multiple sessions on the same day as one streak day", () => {
    const sessions = [
      createSession({ id: "day-1-first", completedAt: "2026-05-28T09:00:00" }),
      createSession({ id: "day-1-second", completedAt: "2026-05-28T18:00:00" }),
      createSession({ id: "day-2", completedAt: "2026-05-29T18:00:00" }),
      createSession({ id: "day-3", completedAt: "2026-05-30T18:00:00" }),
    ];

    const stats = getPracticeHistoryStats(sessions, {
      referenceDate: new Date("2026-05-30T20:00:00"),
    });

    expect(stats.totalSessions).toBe(4);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it("calculates longest streak across broken date ranges", () => {
    expect(getLongestStreak(["2026-05-20", "2026-05-21", "2026-05-24", "2026-05-25", "2026-05-26"])).toBe(3);
  });

  it("calculates this week minutes from Sunday through reference date", () => {
    const sessions = [
      createSession({
        minutes: 20,
        completedAt: "2026-05-23T12:00:00",
      }),
      createSession({
        minutes: 30,
        completedAt: "2026-05-24T12:00:00",
      }),
      createSession({
        minutes: 40,
        completedAt: "2026-05-27T12:00:00",
      }),
      createSession({
        minutes: 50,
        completedAt: "2026-05-31T12:00:00",
      }),
    ];

    expect(getThisWeekMinutes(sessions, new Date("2026-05-30T12:00:00"))).toBe(70);
  });

  it("summarizes today's practice sessions", () => {
    const sessions = [
      createSession({
        id: "today-early",
        minutes: 15,
        completedAt: "2026-05-30T09:00:00",
      }),
      createSession({
        id: "today-late",
        minutes: 25,
        completedAt: "2026-05-30T19:00:00",
      }),
      createSession({
        id: "yesterday",
        minutes: 45,
        completedAt: "2026-05-29T19:00:00",
      }),
    ];

    const summary = getTodayPracticeSummary(sessions, {
      referenceDate: new Date("2026-05-30T21:00:00"),
    });

    expect(summary.hasPracticedToday).toBe(true);
    expect(summary.sessionCount).toBe(2);
    expect(summary.totalMinutes).toBe(40);
    expect(summary.practiceLabel).toBe("40m");
    expect(summary.sessions.map((session) => session.id)).toEqual(["today-late", "today-early"]);
  });

  it("groups practice sessions by day with daily totals", () => {
    const sessions = [
      createSession({
        id: "first",
        minutes: 10,
        completedAt: "2026-05-29T09:00:00",
      }),
      createSession({
        id: "second",
        minutes: 20,
        completedAt: "2026-05-30T10:00:00",
      }),
      createSession({
        id: "third",
        minutes: 30,
        completedAt: "2026-05-30T20:00:00",
      }),
    ];

    const groups = getPracticeDayGroups(sessions);

    expect(groups).toHaveLength(2);
    expect(groups[0].dateKey).toBe("2026-05-30");
    expect(groups[0].sessionCount).toBe(2);
    expect(groups[0].totalMinutes).toBe(50);
    expect(groups[0].totalPracticeLabel).toBe("50m");
    expect(groups[0].sessions.map((session) => session.id)).toEqual(["third", "second"]);
    expect(groups[1].dateKey).toBe("2026-05-29");
  });

  it("averages rating labels", () => {
    expect(getAverageRatingLabel([createSession({ rating: "Easy" }), createSession({ rating: "Okay" }), createSession({ rating: "Hard" })])).toBe("Okay");

    expect(getAverageRatingLabel([createSession({ rating: "Easy" }), createSession({ rating: "Easy" }), createSession({ rating: "Okay" })])).toBe("Easy");

    expect(getAverageRatingLabel([])).toBe("—");
  });
});
