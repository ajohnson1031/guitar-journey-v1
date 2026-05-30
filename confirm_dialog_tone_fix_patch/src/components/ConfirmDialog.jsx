import * as React from "react";
import { createPortal } from "react-dom";

const { Fragment, useEffect, useState } = React;

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
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    setPortalElement(document.body);
  }, []);

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

  if (!isOpen || !portalElement) return null;

  const normalizedTone = tone === "danger" ? "danger" : "primary";

  const dialogContent = (
    <Fragment>
      <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
        <div
          className={`confirm-dialog confirm-dialog--${normalizedTone}`}
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

            <button type="button" className={`confirm-dialog-confirm-button confirm-dialog-confirm-button--${normalizedTone}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );

  return createPortal(dialogContent, portalElement);
}
