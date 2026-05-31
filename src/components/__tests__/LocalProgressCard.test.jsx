import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LocalProgressCard from "../LocalProgressCard";

describe("LocalProgressCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders local progress totals", () => {
    render(
      <LocalProgressCard
        masteredCount={2}
        sessionHistory={[
          {
            id: "session-one",
            minutes: 15,
          },
          {
            id: "session-two",
            minutes: 20,
          },
        ]}
        transitionScores={{
          "G → C": 7,
        }}
      />,
    );

    expect(screen.getByText("Local Progress")).toBeTruthy();
    expect(screen.getByText("songs mastered")).toBeTruthy();
    expect(screen.getByText("tracked transitions")).toBeTruthy();
    expect(screen.getByText("actual minutes")).toBeTruthy();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("35")).toBeTruthy();
  });

  it("calls reset handler", () => {
    const onResetLocalProgress = vi.fn();

    render(<LocalProgressCard onResetLocalProgress={onResetLocalProgress} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset Local Progress" }));

    expect(onResetLocalProgress).toHaveBeenCalled();
  });
});
