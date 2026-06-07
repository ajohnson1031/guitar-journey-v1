import * as React from "react";
import {
  getProviderMetadataSourceLabel,
  getReferenceMetadataProviderSupport,
  resolveReferenceMetadataFromProvider,
} from "../utils/referenceMetadataProviderAdapterUtils";
import {
  createReferenceMetadataSourceStatus,
  getReferenceMetadataSourceLabel,
} from "../utils/referenceMetadataSourceUtils";

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
        sourceLabel: "Manual",
        sourceType: "manual",
        tone: "muted",
      });
      return undefined;
    }

    let isCancelled = false;

    onStatusChangeRef.current?.({
      message: `Detecting metadata from ${sourceLabel}…`,
      sourceLabel,
      sourceType: support,
      tone: "info",
    });

    resolveReferenceMetadataFromProvider(referenceTrack)
      .then((metadata) => {
        if (isCancelled) return;

        if (metadata) {
          const sourceStatus = createReferenceMetadataSourceStatus(metadata);
          const detectedSourceLabel = getReferenceMetadataSourceLabel(metadata);

          onResolveRef.current?.(metadata);
          onStatusChangeRef.current?.({
            message: `Detected metadata from ${detectedSourceLabel}. Review the song details before saving.`,
            sourceLabel: sourceStatus.label,
            sourceType: sourceStatus.sourceType,
            tone: "success",
          });
          return;
        }

        onStatusChangeRef.current?.({
          message: `Could not detect metadata from ${sourceLabel}. Fill in the song details manually.`,
          sourceLabel: "Manual",
          sourceType: "manual",
          tone: "warning",
        });
      })
      .catch(() => {
        if (isCancelled) return;

        onStatusChangeRef.current?.({
          message: `Could not detect metadata from ${sourceLabel}. Fill in the song details manually.`,
          sourceLabel: "Manual",
          sourceType: "manual",
          tone: "warning",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, referenceTrack]);

  return null;
}
