import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_SECTIONS } from "../constants";
import { getSectionRoute } from "../routes/routeConfig";
import { getNavItemRoute, splitDashboardNavSections } from "../utils/navigationUtils";
import ActiveSessionIndicator from "./ActiveSessionIndicator";
import { CalendarDaysIcon, CirclePlusIcon, DashboardIcon, HistoryIcon, ListMusicIcon, MenuIcon, RecordIcon, RepeatIcon, SettingsIcon } from "./AppIcons";

const { Fragment, useEffect, useMemo, useRef, useState } = React;

const NAV_ICON_BY_ID = {
  "add-song": CirclePlusIcon,
  dashboard: DashboardIcon,
  history: HistoryIcon,
  recordings: RecordIcon,
  sections: ListMusicIcon,
  settings: SettingsIcon,
  transitions: RepeatIcon,
  "weekly-plan": CalendarDaysIcon,
};

function getNavItemIcon(itemId) {
  return NAV_ICON_BY_ID[itemId] || DashboardIcon;
}

export default function DashboardNav({ activeSession }) {
  const location = useLocation();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { moreSections, primarySections } = useMemo(() => splitDashboardNavSections(NAV_SECTIONS), []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handleDocumentPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleDocumentKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isMenuOpen]);

  function handleMenuButtonClick() {
    setIsMenuOpen((currentValue) => !currentValue);
  }

  return (
    <Fragment>
      <nav className="dashboard-nav" aria-label="Guitar Journey sections">
        <div className="dashboard-nav-main">
          {primarySections.map((section) => (
            <DashboardNavLink key={section.id} item={section} />
          ))}
        </div>

        <div className="dashboard-nav-side">
          <ActiveSessionIndicator {...activeSession} />

          <div ref={menuRef} className="dashboard-nav-more-wrap">
            <button
              type="button"
              className={`dashboard-nav-more-button  ${isMenuOpen ? "is-open" : ""}`}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={handleMenuButtonClick}
              title="Menu"
            >
              <MenuIcon />
            </button>

            {isMenuOpen ? (
              <div className="dashboard-nav-more-menu" role="menu" aria-label="Additional sections">
                {moreSections.map((section) => (
                  <DashboardNavLink key={section.id} item={section} isMenuItem onClick={() => setIsMenuOpen(false)} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </Fragment>
  );
}

function DashboardNavLink({ isMenuItem = false, item, onClick }) {
  const Icon = getNavItemIcon(item.id);
  const route = getNavItemRoute(item, getSectionRoute);
  const className = isMenuItem ? "dashboard-nav-more-link" : "dashboard-nav-button";

  return (
    <NavLink
      to={route}
      end={route === "/"}
      role={isMenuItem ? "menuitem" : undefined}
      title={item.label}
      aria-label={item.label}
      className={({ isActive }) => `${className} ${isActive ? "is-active" : ""}`}
      onClick={onClick}
    >
      <Icon />
      <span className="dashboard-nav-label">{item.label}</span>
    </NavLink>
  );
}
