const MS_PER_DAY = 24 * 60 * 60 * 1000;

const RATING_SCORES = {
  Hard: 1,
  Okay: 2,
  Easy: 3,
};

const SCORE_RATINGS = [
  {
    label: "Hard",
    max: 1.49,
  },
  {
    label: "Okay",
    max: 2.49,
  },
  {
    label: "Easy",
    max: Number.POSITIVE_INFINITY,
  },
];

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function parseSessionDate(value) {
  const date = new Date(value);

  return isValidDate(date) ? date : null;
}

function startOfLocalDay(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (!isValidDate(date)) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(value) {
  const day = startOfLocalDay(value);

  if (!day) return null;

  const weekStart = new Date(day);

  weekStart.setDate(day.getDate() - day.getDay());

  return weekStart;
}

function addDays(value, amount) {
  const day = startOfLocalDay(value);

  if (!day) return null;

  const nextDay = new Date(day);

  nextDay.setDate(day.getDate() + amount);

  return nextDay;
}

function getDateKey(value) {
  const day = startOfLocalDay(value);

  if (!day) return "";

  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getDateFromKey(dateKey) {
  const [year, month, date] = String(dateKey || "")
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !date) return null;

  return new Date(year, month - 1, date);
}

function getDayDifference(leftDate, rightDate) {
  const leftDay = startOfLocalDay(leftDate);
  const rightDay = startOfLocalDay(rightDate);

  if (!leftDay || !rightDay) return 0;

  return Math.round((leftDay.getTime() - rightDay.getTime()) / MS_PER_DAY);
}

function getSessionActualMinutes(session) {
  const minutes = Number(session?.minutes);

  if (Number.isFinite(minutes) && minutes >= 0) {
    return Math.round(minutes);
  }

  const elapsedSeconds = Number(session?.elapsedSeconds);

  if (Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) {
    return Math.ceil(elapsedSeconds / 60);
  }

  return 0;
}

function getSessionRatingScore(session) {
  return RATING_SCORES[session?.rating] || 0;
}

function getAverageRatingLabel(sessions) {
  const scoredRatings = sessions.map(getSessionRatingScore).filter((score) => score > 0);

  if (!scoredRatings.length) return "—";

  const averageScore = scoredRatings.reduce((sum, score) => sum + score, 0) / scoredRatings.length;
  const rating = SCORE_RATINGS.find((item) => averageScore <= item.max);

  return rating?.label || "—";
}

function getPracticeDateKeys(sessions) {
  return Array.from(
    new Set(
      sessions
        .map((session) => parseSessionDate(session.completedAt))
        .filter(Boolean)
        .map(getDateKey)
        .filter(Boolean),
    ),
  ).sort();
}

function getLongestStreak(practiceDateKeys) {
  if (!practiceDateKeys.length) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < practiceDateKeys.length; index += 1) {
    const previousDate = getDateFromKey(practiceDateKeys[index - 1]);
    const currentDate = getDateFromKey(practiceDateKeys[index]);
    const difference = getDayDifference(currentDate, previousDate);

    if (difference === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak;
}

function getCurrentStreak(practiceDateKeys, referenceDate = new Date()) {
  if (!practiceDateKeys.length) return 0;

  const practicedDates = new Set(practiceDateKeys);
  const today = startOfLocalDay(referenceDate);
  const yesterday = addDays(today, -1);
  const todayKey = getDateKey(today);
  const yesterdayKey = getDateKey(yesterday);

  let streakAnchorKey = "";

  if (practicedDates.has(todayKey)) {
    streakAnchorKey = todayKey;
  } else if (practicedDates.has(yesterdayKey)) {
    streakAnchorKey = yesterdayKey;
  } else {
    return 0;
  }

  let streak = 0;
  let cursor = getDateFromKey(streakAnchorKey);

  while (cursor && practicedDates.has(getDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getThisWeekMinutes(sessions, referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate);
  const referenceDay = startOfLocalDay(referenceDate);

  if (!weekStart || !referenceDay) return 0;

  return sessions.reduce((sum, session) => {
    const sessionDate = parseSessionDate(session.completedAt);
    const sessionDay = sessionDate ? startOfLocalDay(sessionDate) : null;

    if (!sessionDay) return sum;

    if (sessionDay >= weekStart && sessionDay <= referenceDay) {
      return sum + getSessionActualMinutes(session);
    }

    return sum;
  }, 0);
}

function formatPracticeMinutes(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));

  if (safeMinutes < 60) {
    return `${safeMinutes}m`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!remainingMinutes) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatSessionActualDuration(totalSeconds, fallbackMinutes) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));

  if (!safeSeconds) {
    return `${Math.max(0, Math.round(Number(fallbackMinutes) || 0))} min`;
  }

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatPracticeDate(value) {
  const date = parseSessionDate(value);

  if (!date) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPracticeHistoryStats(sessions = [], options = {}) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const referenceDate = options.referenceDate || new Date();
  const totalSessions = safeSessions.length;
  const totalMinutes = safeSessions.reduce((sum, session) => sum + getSessionActualMinutes(session), 0);
  const averageMinutes = totalSessions ? Math.round(totalMinutes / totalSessions) : 0;
  const practiceDateKeys = getPracticeDateKeys(safeSessions);
  const lastPracticeDateKey = practiceDateKeys.at(-1) || "";
  const lastPracticeDate = lastPracticeDateKey ? getDateFromKey(lastPracticeDateKey) : null;

  return {
    totalSessions,
    totalMinutes,
    totalPracticeLabel: formatPracticeMinutes(totalMinutes),
    averageMinutes,
    averagePracticeLabel: formatPracticeMinutes(averageMinutes),
    averageRating: getAverageRatingLabel(safeSessions),
    currentStreak: getCurrentStreak(practiceDateKeys, referenceDate),
    longestStreak: getLongestStreak(practiceDateKeys),
    lastPracticedDate: lastPracticeDate,
    lastPracticedLabel: lastPracticeDate ? formatPracticeDate(lastPracticeDate) : "No sessions yet",
    thisWeekMinutes: getThisWeekMinutes(safeSessions, referenceDate),
    thisWeekPracticeLabel: formatPracticeMinutes(getThisWeekMinutes(safeSessions, referenceDate)),
  };
}

export {
  addDays,
  formatPracticeDate,
  formatPracticeMinutes,
  formatSessionActualDuration,
  getAverageRatingLabel,
  getCurrentStreak,
  getDateFromKey,
  getDateKey,
  getDayDifference,
  getLongestStreak,
  getPracticeDateKeys,
  getPracticeHistoryStats,
  getSessionActualMinutes,
  getThisWeekMinutes,
  parseSessionDate,
  startOfLocalDay,
  startOfWeek,
};
