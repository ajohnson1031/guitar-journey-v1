import * as React from "react";

const { Fragment, useEffect } = React;

export default function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
  tone = "danger",
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <Fragment>
      <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
        <div
          className={`confirm-dialog confirm-dialog--${tone}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="confirm-dialog-copy">
            <p className="eyebrow">Confirm Action</p>
            <h2 id="confirm-dialog-title">{title}</h2>
            <p id="confirm-dialog-message">{message}</p>
          </div>

          <div className="confirm-dialog-actions">
            <button type="button" className="ghost-button" onClick={onCancel}>
              {cancelLabel}
            </button>

            <button type="button" className={tone === "danger" ? "danger-button" : "selected-button"} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
