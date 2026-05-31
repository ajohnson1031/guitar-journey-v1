const PRIMARY_NAV_SECTION_IDS = ["dashboard"];
const MORE_NAV_SECTION_IDS = ["transitions", "sections", "weekly-plan", "history"];

const ADD_SONG_NAV_ITEM = {
  id: "add-song",
  label: "Add Song",
  route: "/songs/new",
};

const PROGRESS_NAV_ITEM = {
  id: "progress",
  label: "Progress",
  route: "/progress",
};

const RECORDINGS_NAV_ITEM = {
  id: "recordings",
  label: "Recordings",
  route: "/recordings",
};

const SETTINGS_NAV_ITEM = {
  id: "settings",
  label: "Settings",
  route: "/settings",
};

function getNavItemRoute(item, getSectionRoute) {
  if (item.route) return item.route;

  return getSectionRoute(item.id);
}

function splitDashboardNavSections(navSections = []) {
  const safeSections = Array.isArray(navSections) ? navSections : [];
  const sectionById = new Map(safeSections.map((section) => [section.id, section]));

  const primarySections = PRIMARY_NAV_SECTION_IDS.map((sectionId) => sectionById.get(sectionId)).filter(Boolean);
  const moreSections = MORE_NAV_SECTION_IDS.map((sectionId) => sectionById.get(sectionId)).filter(Boolean);

  return {
    moreSections: [...moreSections, RECORDINGS_NAV_ITEM, ADD_SONG_NAV_ITEM, SETTINGS_NAV_ITEM],
    primarySections: [...primarySections, PROGRESS_NAV_ITEM],
  };
}

function isRouteActiveForNavItem({ currentPathname = "/", item, route }) {
  if (!item || !route) return false;

  if (route === "/") {
    return currentPathname === "/";
  }

  return currentPathname === route || currentPathname.startsWith(`${route}/`);
}

function isAnyNavItemActive({ currentPathname = "/", getSectionRoute, items = [] }) {
  return items.some((item) =>
    isRouteActiveForNavItem({
      currentPathname,
      item,
      route: getNavItemRoute(item, getSectionRoute),
    }),
  );
}

export {
  ADD_SONG_NAV_ITEM,
  getNavItemRoute,
  isAnyNavItemActive,
  isRouteActiveForNavItem,
  MORE_NAV_SECTION_IDS,
  PRIMARY_NAV_SECTION_IDS,
  PROGRESS_NAV_ITEM,
  RECORDINGS_NAV_ITEM,
  SETTINGS_NAV_ITEM,
  splitDashboardNavSections,
};
