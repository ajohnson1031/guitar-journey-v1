import { CHORD_DIAGRAMS } from "../constants";

const NOTE_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const E_STRING_NOTE_INDEX = NOTE_INDEX.E;
const A_STRING_NOTE_INDEX = NOTE_INDEX.A;

const OPEN_POSITION_DIAGRAMS = {
  A: {
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
  },
  Am: {
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
  },
  A7: {
    frets: [-1, 0, 2, 0, 2, 0],
    fingers: [0, 0, 1, 0, 2, 0],
  },
  Am7: {
    frets: [-1, 0, 2, 0, 1, 0],
    fingers: [0, 0, 2, 0, 1, 0],
  },
  Amaj7: {
    frets: [-1, 0, 2, 1, 2, 0],
    fingers: [0, 0, 2, 1, 3, 0],
  },
  Asus2: {
    frets: [-1, 0, 2, 2, 0, 0],
    fingers: [0, 0, 1, 2, 0, 0],
  },
  Asus4: {
    frets: [-1, 0, 2, 2, 3, 0],
    fingers: [0, 0, 1, 2, 3, 0],
  },
  A5: {
    frets: [-1, 0, 2, 2, -1, -1],
    fingers: [0, 0, 1, 3, 0, 0],
  },

  E: {
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
  },
  Em: {
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
  },
  E7: {
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
  },
  Em7: {
    frets: [0, 2, 0, 0, 0, 0],
    fingers: [0, 2, 0, 0, 0, 0],
  },
  Emaj7: {
    frets: [0, 2, 1, 1, 0, 0],
    fingers: [0, 3, 1, 2, 0, 0],
  },
  Esus2: {
    frets: [0, 2, 4, 4, 0, 0],
    fingers: [0, 1, 3, 4, 0, 0],
  },
  Esus4: {
    frets: [0, 2, 2, 2, 0, 0],
    fingers: [0, 1, 2, 3, 0, 0],
  },
  E5: {
    frets: [0, 2, 2, -1, -1, -1],
    fingers: [0, 1, 3, 0, 0, 0],
  },

  D: {
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
  },
  Dm: {
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
  },
  D7: {
    frets: [-1, -1, 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
  },
  Dm7: {
    frets: [-1, -1, 0, 2, 1, 1],
    fingers: [0, 0, 0, 2, 1, 1],
  },
  Dmaj7: {
    frets: [-1, -1, 0, 2, 2, 2],
    fingers: [0, 0, 0, 1, 1, 1],
  },
  Dsus2: {
    frets: [-1, -1, 0, 2, 3, 0],
    fingers: [0, 0, 0, 1, 2, 0],
  },
  Dsus4: {
    frets: [-1, -1, 0, 2, 3, 3],
    fingers: [0, 0, 0, 1, 2, 3],
  },
  D5: {
    frets: [-1, -1, 0, 2, 3, -1],
    fingers: [0, 0, 0, 1, 3, 0],
  },

  C: {
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
  },
  C7: {
    frets: [-1, 3, 2, 3, 1, 0],
    fingers: [0, 3, 2, 4, 1, 0],
  },
  Cmaj7: {
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
  },
  Csus2: {
    frets: [-1, 3, 0, 0, 1, 3],
    fingers: [0, 3, 0, 0, 1, 4],
  },
  Csus4: {
    frets: [-1, 3, 3, 0, 1, 1],
    fingers: [0, 3, 4, 0, 1, 1],
  },
  Cadd9: {
    frets: [-1, 3, 2, 0, 3, 0],
    fingers: [0, 3, 2, 0, 4, 0],
  },
  C5: {
    frets: [-1, 3, 5, 5, -1, -1],
    fingers: [0, 1, 3, 4, 0, 0],
    startFret: 3,
  },

  G: {
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
  },
  G7: {
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
  },
  Gmaj7: {
    frets: [3, 2, 0, 0, 0, 2],
    fingers: [3, 1, 0, 0, 0, 2],
  },
  Gsus4: {
    frets: [3, 3, 0, 0, 1, 3],
    fingers: [2, 3, 0, 0, 1, 4],
  },
  G5: {
    frets: [3, 5, 5, -1, -1, -1],
    fingers: [1, 3, 4, 0, 0, 0],
    startFret: 3,
  },
};

const TEMPLATES = {
  major: {
    e: {
      frets: [0, 2, 2, 1, 0, 0],
      fingers: [1, 3, 4, 2, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 2, 2, 0],
      fingers: [0, 1, 3, 3, 3, 1],
    },
  },
  minor: {
    e: {
      frets: [0, 2, 2, 0, 0, 0],
      fingers: [1, 3, 4, 1, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 2, 1, 0],
      fingers: [0, 1, 3, 4, 2, 1],
    },
  },
  7: {
    e: {
      frets: [0, 2, 0, 1, 0, 0],
      fingers: [1, 3, 1, 2, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 0, 2, 0],
      fingers: [0, 1, 3, 1, 4, 1],
    },
  },
  m7: {
    e: {
      frets: [0, 2, 0, 0, 0, 0],
      fingers: [1, 3, 1, 1, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 0, 1, 0],
      fingers: [0, 1, 3, 1, 2, 1],
    },
  },
  maj7: {
    e: {
      frets: [0, 2, 1, 1, 0, 0],
      fingers: [1, 4, 2, 3, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 1, 2, 0],
      fingers: [0, 1, 4, 2, 3, 1],
    },
  },
  sus2: {
    e: {
      frets: [0, 2, 4, 4, 0, 0],
      fingers: [1, 2, 4, 4, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 2, 0, 0],
      fingers: [0, 1, 3, 4, 1, 1],
    },
  },
  sus4: {
    e: {
      frets: [0, 2, 2, 2, 0, 0],
      fingers: [1, 2, 3, 4, 1, 1],
    },
    a: {
      frets: [-1, 0, 2, 2, 3, 0],
      fingers: [0, 1, 2, 3, 4, 1],
    },
  },
  dim: {
    a: {
      frets: [-1, 0, 1, 2, 1, -1],
      fingers: [0, 1, 2, 4, 3, 0],
    },
  },
  dim7: {
    a: {
      frets: [-1, 0, 1, 2, 1, 2],
      fingers: [0, 1, 2, 4, 3, 4],
    },
  },
  m7b5: {
    a: {
      frets: [-1, 0, 1, 0, 1, -1],
      fingers: [0, 1, 2, 1, 3, 0],
    },
  },
  add9: {
    a: {
      frets: [-1, 0, 2, 2, 0, 2],
      fingers: [0, 1, 3, 3, 1, 4],
    },
  },
  6: {
    e: {
      frets: [0, 2, 2, 1, 2, 0],
      fingers: [1, 3, 4, 2, 4, 1],
    },
    a: {
      frets: [-1, 0, 2, 2, 2, 2],
      fingers: [0, 1, 2, 3, 4, 4],
    },
  },
  m6: {
    e: {
      frets: [0, 2, 2, 0, 2, 0],
      fingers: [1, 3, 4, 1, 4, 1],
    },
    a: {
      frets: [-1, 0, 2, 2, 1, 2],
      fingers: [0, 1, 3, 3, 2, 4],
    },
  },
  5: {
    e: {
      frets: [0, 2, 2, -1, -1, -1],
      fingers: [1, 3, 4, 0, 0, 0],
    },
    a: {
      frets: [-1, 0, 2, 2, -1, -1],
      fingers: [0, 1, 3, 4, 0, 0],
    },
  },
};

function normalizeRoot(root) {
  if (!root) return "";

  const letter = root[0].toUpperCase();
  const accidental = root.slice(1);

  return `${letter}${accidental}`;
}

function normalizeQuality(rawQuality) {
  const quality = String(rawQuality || "")
    .replace(/\s+/g, "")
    .replace("△", "maj")
    .replace("Δ", "maj")
    .toLowerCase();

  if (!quality) return "major";

  const aliases = {
    maj: "major",
    major: "major",

    m: "minor",
    min: "minor",
    minor: "minor",
    "-": "minor",

    5: "5",

    6: "6",
    maj6: "6",
    major6: "6",

    m6: "m6",
    min6: "m6",
    minor6: "m6",

    7: "7",
    dom7: "7",
    dominant7: "7",

    m7: "m7",
    min7: "m7",
    minor7: "m7",
    "-7": "m7",

    maj7: "maj7",
    major7: "maj7",
    ma7: "maj7",
    m7major: "maj7",

    sus: "sus4",
    sus4: "sus4",
    sus2: "sus2",

    dim: "dim",
    "°": "dim",

    dim7: "dim7",
    "°7": "dim7",

    m7b5: "m7b5",
    min7b5: "m7b5",
    minor7b5: "m7b5",
    halfdim: "m7b5",
    halfdiminished: "m7b5",
    ø: "m7b5",
    ø7: "m7b5",

    add9: "add9",

    9: "7",
    dom9: "7",
    dominant9: "7",

    m9: "m7",
    min9: "m7",
    minor9: "m7",

    maj9: "maj7",
    major9: "maj7",

    11: "7",
    13: "7",
    "7sus": "sus4",
    "7sus4": "sus4",
  };

  return aliases[quality] || quality;
}

function parseChordName(chordName) {
  const baseName = String(chordName || "")
    .split("/")[0]
    .trim();
  const match = baseName.match(/^([A-Ga-g](?:#|b)?)(.*)$/);

  if (!match) return null;

  const root = normalizeRoot(match[1]);
  const quality = normalizeQuality(match[2]);

  if (NOTE_INDEX[root] === undefined) return null;

  return {
    root,
    quality,
    normalizedName: `${root}${quality === "major" ? "" : quality}`,
  };
}

function getRootFret(root, stringNoteIndex) {
  return (NOTE_INDEX[root] - stringNoteIndex + 12) % 12;
}

function transposeTemplate(template, rootFret, rootString) {
  const frets = template.frets.map((fret) => {
    if (fret < 0) return -1;

    return fret + rootFret;
  });

  const playedFrets = frets.filter((fret) => fret > 0);
  const minPlayedFret = playedFrets.length ? Math.min(...playedFrets) : 0;
  const maxPlayedFret = playedFrets.length ? Math.max(...playedFrets) : 0;

  return {
    frets,
    fingers: template.fingers,
    rootString,
    startFret: minPlayedFret > 1 ? minPlayedFret : undefined,
    maxPlayedFret,
    score: maxPlayedFret,
    isGenerated: true,
  };
}

function getBestGeneratedDiagram(root, quality) {
  const templates = TEMPLATES[quality];

  if (!templates) return null;

  const candidates = [];

  if (templates.e) {
    candidates.push(transposeTemplate(templates.e, getRootFret(root, E_STRING_NOTE_INDEX), "E"));
  }

  if (templates.a) {
    candidates.push(transposeTemplate(templates.a, getRootFret(root, A_STRING_NOTE_INDEX), "A"));
  }

  if (!candidates.length) return null;

  return candidates.sort((a, b) => a.score - b.score)[0];
}

export function getChordDiagram(chordName) {
  const exactDiagram = CHORD_DIAGRAMS[chordName];

  if (exactDiagram) return exactDiagram;

  const parsed = parseChordName(chordName);

  if (!parsed) return null;

  const openPositionDiagram = OPEN_POSITION_DIAGRAMS[parsed.normalizedName];

  if (openPositionDiagram) return openPositionDiagram;

  return getBestGeneratedDiagram(parsed.root, parsed.quality);
}

export function hasChordDiagram(chordName) {
  return Boolean(getChordDiagram(chordName));
}
