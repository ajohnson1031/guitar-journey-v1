function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((word) => {
      if (!word) return word;

      return `${word[0].toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSections(value) {
  const sections = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameRaw, ...progressionParts] = line.split(":");
      const name = nameRaw?.trim() || "Section";
      const progression = progressionParts.join(":").trim();

      return {
        name,
        progression: progression || line,
      };
    });

  if (sections.length) return sections;

  return [{ name: "Main", progression: "X - X - X - X" }];
}

function parseUltimateGuitarUrl(value) {
  try {
    const url = new URL(value.trim());

    const isUltimateGuitar = url.hostname === "tabs.ultimate-guitar.com" || url.hostname === "www.ultimate-guitar.com" || url.hostname === "ultimate-guitar.com";

    if (!isUltimateGuitar) {
      return {
        ok: false,
        message: "That does not look like an Ultimate Guitar link.",
      };
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const tabIndex = pathParts.indexOf("tab");

    if (tabIndex === -1) {
      return {
        ok: false,
        message: "Could not find a tab path in that Ultimate Guitar link.",
      };
    }

    const artistSlug = pathParts[tabIndex + 1] || "";
    const songSlug = pathParts[tabIndex + 2] || "";

    if (!artistSlug || !songSlug) {
      return {
        ok: false,
        message: "Could not read artist and song information from that link.",
      };
    }

    const tabIdMatch = songSlug.match(/-(\d+)$/);
    const tabId = tabIdMatch?.[1] || "";

    const songSlugWithoutId = tabId ? songSlug.replace(`-${tabId}`, "") : songSlug;
    const knownTypes = ["chords", "tab", "tabs", "bass", "ukulele", "drums", "guitar-pro"];
    const songParts = songSlugWithoutId.split("-").filter(Boolean);

    let instrument = "Guitar";
    let titleParts = songParts;

    const lastPart = songParts[songParts.length - 1];

    if (knownTypes.includes(lastPart)) {
      instrument = lastPart === "guitar-pro" ? "Guitar Pro" : titleCase(lastPart);
      titleParts = songParts.slice(0, -1);
    }

    const artist = titleCase(artistSlug);
    const title = titleCase(titleParts.join("-"));

    return {
      ok: true,
      data: {
        artist,
        title,
        instrument,
        tabId,
        source: "Ultimate Guitar",
        sourceUrl: url.toString(),
      },
    };
  } catch {
    return {
      ok: false,
      message: "Enter a valid Ultimate Guitar URL.",
    };
  }
}

function sanitizeTransitionValue(value) {
  return String(value || "")
    .replace(/[^a-zA-Z,\s→]/g, "")
    .replace(/\s{2,}/g, " ");
}

function formatTransitionValue(value) {
  return sanitizeTransitionValue(value)
    .replace(/\s*→\s*/g, " → ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getNextTransitionValue(currentValue, addition) {
  const value = String(currentValue || "");

  if (addition === "arrow") {
    const trimmed = value.trimEnd();

    if (!trimmed) return value;
    if (trimmed.endsWith("→")) return `${trimmed} `;
    if (trimmed.endsWith(",")) return `${trimmed} `;

    return `${trimmed} → `;
  }

  if (addition === "comma") {
    const trimmed = value.trimEnd();

    if (!trimmed) return value;
    if (trimmed.endsWith(",")) return `${trimmed} `;
    if (trimmed.endsWith("→")) return trimmed;

    return `${trimmed}, `;
  }

  return value;
}

export { formatTransitionValue, getNextTransitionValue, parseCommaList, parseSections, parseUltimateGuitarUrl, sanitizeTransitionValue, slugify, titleCase };
