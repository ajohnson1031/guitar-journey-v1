import * as React from "react";
import { getMetadataSourceLabel, getReferenceMetadataSupport, resolveReferenceMetadata } from "../utils/referenceMetadataUtils";

const { useEffect, useRef } = React;

export default function ReferenceMetadataResolver({ enabled = true, onResolve, onStatusChange, referenceTrack }) {
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

    const support = getReferenceMetadataSupport(referenceTrack);
    const sourceLabel = getMetadataSourceLabel(referenceTrack);

    if (support === "unsupported") {
      onStatusChangeRef.current?.({
        message: "Could not auto-detect metadata for this source yet. Fill in the song details manually.",
        tone: "muted",
      });
      return undefined;
    }

    let isCancelled = false;

    onStatusChangeRef.current?.({
      message: `Detecting metadata from ${sourceLabel}…`,
      tone: "info",
    });

    resolveReferenceMetadata(referenceTrack)
      .then((metadata) => {
        if (isCancelled) return;

      if (metadata) {
        // ! REMOVE THIS DEV-ONLY LOGGING BEFORE LAUNCH
        if (import.meta.env.DEV) {
          console.group("[ReferenceMetadataResolver] Resolved metadata");
          console.log("referenceTrack:", referenceTrack);
          console.log("metadata:", metadata);
          console.groupEnd();
        }
        // ! REMOVE THE ABOVE DEV-ONLY LOGGING BEFORE LAUNCH
        onResolveRef.current?.(metadata);
        onStatusChangeRef.current?.({
          message: `Detected metadata from ${sourceLabel}. Review the song details before saving.`,
          tone: "success",
        });
        return;
      }

        onStatusChangeRef.current?.({
          message: `Could not detect metadata from ${sourceLabel}. Fill in the song details manually.`,
          tone: "warning",
        });
      })
      .catch(() => {
        if (isCancelled) return;

        onStatusChangeRef.current?.({
          message: `Could not detect metadata from ${sourceLabel}. Fill in the song details manually.`,
          tone: "warning",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, referenceTrack]);

  return null;
}
