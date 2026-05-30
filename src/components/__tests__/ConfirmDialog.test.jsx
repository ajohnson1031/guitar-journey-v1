import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmDialog from "../ConfirmDialog";

function renderConfirmDialog(props = {}) {
  return render(
    <ConfirmDialog
      isOpen
      title="Confirm test?"
      message="Confirm this test action."
      confirmLabel="Confirm"
      cancelLabel="Cancel"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
      {...props}
    />,
  );
}

describe("ConfirmDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders primary confirm actions in blue", () => {
    renderConfirmDialog({
      tone: "primary",
    });

    expect(screen.getByRole("button", { name: "Confirm" }).className).toContain("confirm-dialog-confirm-button--primary");
  });

  it("renders destructive confirm actions in danger styling", () => {
    renderConfirmDialog({
      tone: "danger",
    });

    expect(screen.getByRole("button", { name: "Confirm" }).className).toContain("confirm-dialog-confirm-button--danger");
  });

  it("calls cancel when clicking the backdrop", () => {
    const onCancel = vi.fn();

    renderConfirmDialog({
      onCancel,
    });

    fireEvent.mouseDown(screen.getByRole("presentation"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("calls cancel when Escape is pressed", () => {
    const onCancel = vi.fn();

    renderConfirmDialog({
      onCancel,
    });

    fireEvent.keyDown(window, {
      key: "Escape",
    });

    expect(onCancel).toHaveBeenCalled();
  });
});
