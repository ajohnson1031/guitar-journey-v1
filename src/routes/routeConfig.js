const SECTION_ROUTES = {
  dashboard: "/",
  transitions: "/transitions",
  sections: "/sections",
  history: "/history",
  "weekly-plan": "/weekly-plan",
};

function getSectionRoute(sectionId) {
  return SECTION_ROUTES[sectionId] || "/";
}

export { SECTION_ROUTES, getSectionRoute };
