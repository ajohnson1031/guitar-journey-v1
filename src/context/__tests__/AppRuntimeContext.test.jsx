import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRuntimeProvider, requireAppRuntimeContext, useAppRuntimeContext } from "../AppRuntimeContext";

function AppRuntimeConsumer() {
  const { onProgressImported } = useAppRuntimeContext();

  return (
    <button type="button" onClick={onProgressImported}>
      Import progress
    </button>
  );
}

describe("AppRuntimeContext", () => {
  afterEach(() => {
    cleanup();
  });

  it("provides app runtime controls to descendants", () => {
    const handleProgressImported = vi.fn();

    render(
      <AppRuntimeProvider onProgressImported={handleProgressImported}>
        <AppRuntimeConsumer />
      </AppRuntimeProvider>,
    );

    screen.getByRole("button", { name: "Import progress" }).click();

    expect(handleProgressImported).toHaveBeenCalledTimes(1);
  });

  it("throws when the required app runtime context value is missing", () => {
    expect(() => requireAppRuntimeContext(null)).toThrow("useAppRuntimeContext must be used inside AppRuntimeProvider.");
  });
});
