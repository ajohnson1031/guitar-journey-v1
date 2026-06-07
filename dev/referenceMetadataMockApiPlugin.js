const REFERENCE_METADATA_API_PATH = "/api/reference-metadata";

const MOCK_METADATA_BY_KEY = {
  "backend-reference-demo": {
    authorName: "Backend Mock Artist",
    chapterText: `0:00 Intro
0:18 Verse
0:52 Chorus
1:28 Verse 2
2:04 Chorus
2:40 Bridge
3:16 Final Chorus
4:08 Outro`,
    descriptionText: "Vite dev-server mock response for the future reference metadata backend endpoint.",
    durationSeconds: 274,
    providerName: "YouTube",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    title: "Backend Mock Practice Reference",
  },
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

function getUrlFromRequest(req) {
  return new URL(req.url || "", "http://localhost");
}

function getSourceUrlFlag(sourceUrl, flagName) {
  if (!sourceUrl) return false;

  try {
    const url = new URL(sourceUrl);

    return url.searchParams.get(flagName) === "1";
  } catch {
    return false;
  }
}

function getMockMetadataKey({ mediaId = "", sourceUrl = "" } = {}) {
  if (mediaId && MOCK_METADATA_BY_KEY[mediaId]) {
    return mediaId;
  }

  if (getSourceUrlFlag(sourceUrl, "gjBackendMock") || getSourceUrlFlag(sourceUrl, "backendMock")) {
    return "backend-reference-demo";
  }

  return "";
}

function buildMockReferenceMetadataResponse({ mediaId = "", platform = "generic", sourceUrl = "" } = {}) {
  const mockKey = getMockMetadataKey({
    mediaId,
    sourceUrl,
  });

  if (!mockKey) return null;

  const metadata = MOCK_METADATA_BY_KEY[mockKey];

  return {
    metadata: {
      ...metadata,
      mediaId: mediaId || mockKey,
      platform,
      sourceType: "backend-mock",
      sourceUrl,
    },
  };
}

function handleReferenceMetadataMockRequest(req, res) {
  if (req.method && req.method !== "GET") {
    sendJson(res, 405, {
      error: "Method not allowed.",
    });
    return;
  }

  const requestUrl = getUrlFromRequest(req);
  const sourceUrl = requestUrl.searchParams.get("url") || "";
  const platform = requestUrl.searchParams.get("platform") || "generic";
  const mediaId = requestUrl.searchParams.get("mediaId") || "";

  if (!sourceUrl) {
    sendJson(res, 400, {
      error: "Missing required url query parameter.",
    });
    return;
  }

  const payload = buildMockReferenceMetadataResponse({
    mediaId,
    platform,
    sourceUrl,
  });

  if (!payload) {
    sendJson(res, 404, {
      error: "No mock reference metadata found for this URL.",
    });
    return;
  }

  sendJson(res, 200, payload);
}

function referenceMetadataMockApiPlugin() {
  return {
    name: "guitar-journey-reference-metadata-mock-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(REFERENCE_METADATA_API_PATH, handleReferenceMetadataMockRequest);
    },
  };
}

export {
  REFERENCE_METADATA_API_PATH,
  buildMockReferenceMetadataResponse,
  getMockMetadataKey,
  handleReferenceMetadataMockRequest,
  referenceMetadataMockApiPlugin,
};
