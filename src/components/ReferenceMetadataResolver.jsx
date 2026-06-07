import * as React from "react";
import {
  getProviderMetadataSourceLabel,
  getReferenceMetadataProviderSupport,
  resolveReferenceMetadataFromProvider,
} from "../utils/referenceMetadataProviderAdapterUtils";

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

    const support = getReferenceMetadataProviderSupport(referenceTrack);
    const sourceLabel = getProviderMetadataSourceLabel(referenceTrack);

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

    resolveReferenceMetadataFromProvider(referenceTrack)
      .then((metadata) => {
        if (isCancelled) return;

        if (metadata) {
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
