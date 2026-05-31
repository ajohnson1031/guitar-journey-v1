import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DashboardNav from "../DashboardNav";

function renderDashboardNav(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DashboardNav
        activeSession={{
          elapsedSessionSeconds: 90,
          isActive: route !== "/",
          isSessionTimerRunning: true,
        }}
      />
    </MemoryRouter>,
  );
}

describe("DashboardNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders primary nav links and right-aligned hamburger menu button", () => {
    renderDashboardNav();

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Practice History" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
  });

  it("opens secondary navigation from the hamburger menu", () => {
    renderDashboardNav();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));

    expect(screen.getByRole("menu", { name: "Additional sections" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Transition Tracker" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Song Sections" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Weekly Plan" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Add Song" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Settings" })).toBeTruthy();
  });

  it("shows the active session indicator outside dashboard", () => {
    renderDashboardNav("/settings");

    expect(screen.getByLabelText("Active session indicator")).toBeTruthy();
  });
});
