import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { GuitarJourneyProvider, requireGuitarJourneyContext, useGuitarJourneyContext } from "../GuitarJourneyContext";

function GuitarJourneyConsumer() {
  const { activeSessionProps, dashboardRouteProps } = useGuitarJourneyContext();

  return (
    <div>
      <span>{dashboardRouteProps.selectedSong.title}</span>
      <strong>{activeSessionProps.isActive ? "active" : "idle"}</strong>
    </div>
  );
}

describe("GuitarJourneyContext", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("provides guitar journey app state to descendants", () => {
    render(
      <MemoryRouter>
        <GuitarJourneyProvider>
          <GuitarJourneyConsumer />
        </GuitarJourneyProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Good Good Father")).toBeTruthy();
    expect(screen.getByText("idle")).toBeTruthy();
  });

  it("throws when the required guitar journey context value is missing", () => {
    expect(() => requireGuitarJourneyContext(null)).toThrow("useGuitarJourneyContext must be used inside GuitarJourneyProvider.");
  });
});
