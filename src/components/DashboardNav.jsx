import * as React from "react";
import { NavLink } from "react-router-dom";
import { NAV_SECTIONS } from "../constants";
import { getSectionRoute } from "../routes/routeConfig";

const { Fragment } = React;

export default function DashboardNav() {
  return (
    <Fragment>
      <nav className="dashboard-nav" aria-label="Guitar Journey sections">
        <div className="dashboard-nav-main">
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

          <NavLink to="/songs/new" className={({ isActive }) => `dashboard-nav-button ${isActive ? "is-active" : ""}`}>
            Add Song
          </NavLink>
        </div>

        <NavLink
          to="/settings"
          title="Settings"
          aria-label="Settings"
          className={({ isActive }) => `dashboard-nav-button dashboard-settings-button ${isActive ? "is-active" : ""}`}
        >
          <GearIcon />
        </NavLink>
      </nav>
    </Fragment>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
