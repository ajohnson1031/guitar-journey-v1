import * as React from "react";
import { formatTransitionValue, getNextTransitionValue, sanitizeTransitionValue } from "../utils/songFormUtils";

const { Fragment } = React;

export default function TransitionInput({ value, onChange }) {
  function handleKeyDown(event) {
    const allowedControlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Tab"];

    if (allowedControlKeys.includes(event.key) || event.metaKey || event.ctrlKey) {
      return;
    }

    if (/^[a-zA-Z]$/.test(event.key)) {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      onChange(getNextTransitionValue(value, "arrow"));
      return;
    }

    if (event.key === ",") {
      event.preventDefault();
      onChange(getNextTransitionValue(value, "comma"));
      return;
    }

    event.preventDefault();
  }

  function handleChange(event) {
    onChange(sanitizeTransitionValue(event.target.value));
  }

  function handleBlur(event) {
    onChange(formatTransitionValue(event.target.value));
  }

  return (
    <Fragment>
      <label>
        <span>Transitions</span>
        <input type="text" value={value} placeholder="e.g., G → C, C → G, G → D, Em → C" onKeyDown={handleKeyDown} onChange={handleChange} onBlur={handleBlur} />
      </label>
    </Fragment>
  );
}
