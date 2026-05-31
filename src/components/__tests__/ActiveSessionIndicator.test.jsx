import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ActiveSessionIndicator from "../ActiveSessionIndicator";

function renderIndicator({ route = "/settings", props = {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ActiveSessionIndicator
        elapsedSessionSeconds={125}
        isActive
        isSessionRecording={false}
        isSessionRecordingPaused={false}
        isSessionTimerRunning
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("ActiveSessionIndicator", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render on the dashboard route", () => {
    renderIndicator({
      route: "/",
    });

    expect(screen.queryByLabelText("Active session indicator")).toBeNull();
  });

  it("renders active session time outside the dashboard route", () => {
    renderIndicator();

    const indicator = screen.getByLabelText("Active session indicator");

    expect(indicator).toBeTruthy();
    expect(screen.getByText("02:05")).toBeTruthy();
    expect(screen.getByText("Session running")).toBeTruthy();
    expect(indicator.getAttribute("href")).toBe("/");
  });

  it("renders recording state", () => {
    renderIndicator({
      props: {
        isSessionRecording: true,
      },
    });

    expect(screen.getByText("Recording")).toBeTruthy();
    expect(screen.getByLabelText("Active session indicator").className).toContain("is-recording");
  });

  it("renders route-paused recording state", () => {
    renderIndicator({
      props: {
        isSessionRecording: true,
        isSessionRecordingPaused: true,
      },
    });

    expect(screen.getByText("Recording paused")).toBeTruthy();
    expect(screen.getByLabelText("Active session indicator").className).toContain("is-recording-paused");
  });
});
