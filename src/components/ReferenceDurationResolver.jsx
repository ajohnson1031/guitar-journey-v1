import * as React from "react";
import { formatReferenceDuration, getDurationDetectionSupport, getReferenceDurationSourceLabel, resolveReferenceDuration } from "../utils/referenceDurationUtils";

const { useEffect, useRef } = React;

export default function ReferenceDurationResolver({ enabled = true, onResolve, onStatusChange, referenceTrack }) {
  const probeRef = useRef(null);
  const onResolveRef = useRef(onResolve);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onResolveRef.current = onResolve;
  }, [onResolve]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!enabled || !referenceTrack?.isValid || referenceTrack.isEmpty) {
      return undefined;
    }

    const support = getDurationDetectionSupport(referenceTrack);
    const sourceLabel = getReferenceDurationSourceLabel(referenceTrack);

    if (support === "unsupported") {
      onStatusChangeRef.current?.({
        message: "Could not auto-detect duration for this source yet. Add it manually for better marker spacing.",
        tone: "muted",
      });
      return undefined;
    }

    let isCancelled = false;

    onStatusChangeRef.current?.({
      message: `Detecting duration from ${sourceLabel}…`,
      tone: "info",
    });

    resolveReferenceDuration(referenceTrack, {
      container: probeRef.current,
      isCancelled: () => isCancelled,
    })
      .then((seconds) => {
        if (isCancelled) return;

        if (seconds) {
          onResolveRef.current?.(seconds, {
            formattedDuration: formatReferenceDuration(seconds),
            source: support,
            sourceLabel,
          });
          onStatusChangeRef.current?.({
            message: `Detected ${formatReferenceDuration(seconds)} from ${sourceLabel}. You can override it manually.`,
            tone: "success",
          });
          return;
        }

        onStatusChangeRef.current?.({
          message: `Could not auto-detect duration from ${sourceLabel}. Add it manually for better marker spacing.`,
          tone: "warning",
        });
      })
      .catch(() => {
        if (isCancelled) return;

        onStatusChangeRef.current?.({
          message: `Could not auto-detect duration from ${sourceLabel}. Add it manually for better marker spacing.`,
          tone: "warning",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, referenceTrack]);

  return <div ref={probeRef} className="reference-duration-probe" aria-hidden="true" />;
}
