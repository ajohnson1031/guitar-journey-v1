import { describe, expect, it } from "vitest";
import { getNavItemRoute, isAnyNavItemActive, isRouteActiveForNavItem, splitDashboardNavSections } from "../navigationUtils";

const navSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "transitions", label: "Transition Tracker" },
  { id: "sections", label: "Song Sections" },
  { id: "history", label: "Practice History" },
  { id: "weekly-plan", label: "Weekly Plan" },
];

function getSectionRoute(sectionId) {
  return {
    dashboard: "/",
    history: "/history",
    sections: "/sections",
    transitions: "/transitions",
    "weekly-plan": "/weekly-plan",
  }[sectionId];
}

describe("navigationUtils", () => {
  it("splits dashboard nav into primary and hamburger menu sections", () => {
    const result = splitDashboardNavSections(navSections);

    expect(result.primarySections.map((section) => section.id)).toEqual(["dashboard", "history"]);
    expect(result.moreSections.map((section) => section.id)).toEqual(["transitions", "sections", "weekly-plan", "recordings", "add-song", "settings"]);
  });

  it("resolves explicit and section routes", () => {
    expect(getNavItemRoute({ id: "history" }, getSectionRoute)).toBe("/history");
    expect(getNavItemRoute({ id: "add-song", route: "/songs/new" }, getSectionRoute)).toBe("/songs/new");
    expect(getNavItemRoute({ id: "settings", route: "/settings" }, getSectionRoute)).toBe("/settings");
  });

  it("matches active routes", () => {
    expect(
      isRouteActiveForNavItem({
        currentPathname: "/",
        item: { id: "dashboard" },
        route: "/",
      }),
    ).toBe(true);

    expect(
      isRouteActiveForNavItem({
        currentPathname: "/songs/edit/custom-song",
        item: { id: "add-song" },
        route: "/songs/new",
      }),
    ).toBe(false);

    expect(
      isRouteActiveForNavItem({
        currentPathname: "/weekly-plan/details",
        item: { id: "weekly-plan" },
        route: "/weekly-plan",
      }),
    ).toBe(true);
  });

  it("detects active hamburger menu items", () => {
    expect(
      isAnyNavItemActive({
        currentPathname: "/settings",
        getSectionRoute,
        items: [{ id: "settings", label: "Settings", route: "/settings" }],
      }),
    ).toBe(true);

    expect(
      isAnyNavItemActive({
        currentPathname: "/history",
        getSectionRoute,
        items: [{ id: "sections", label: "Song Sections" }],
      }),
    ).toBe(false);
  });
});
