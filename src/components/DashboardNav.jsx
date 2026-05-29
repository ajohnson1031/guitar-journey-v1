import * as React from "react";
import { NavLink } from "react-router-dom";
import { NAV_SECTIONS } from "../constants";
import { getSectionRoute } from "../routes/routeConfig";

const { Fragment } = React;

export default function DashboardNav() {
  return (
    <Fragment>
      <nav className="dashboard-nav" aria-label="Guitar Journey sections">
        {NAV_SECTIONS.map((section) => (
          <NavLink
            key={section.id}
            to={getSectionRoute(section.id)}
            end={section.id === "dashboard"}
            className={({ isActive }) => `dashboard-nav-button ${isActive ? "is-active" : ""}`}
          >
            {section.label}
          </NavLink>
        ))}

        <NavLink
          to="/songs/new"
          className={({ isActive }) => `dashboard-nav-button ${isActive ? "is-active" : ""}`}
        >
          Add Song
        </NavLink>
      </nav>
    </Fragment>
  );
}
