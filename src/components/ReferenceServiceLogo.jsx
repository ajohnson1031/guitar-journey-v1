import * as React from "react";
import { SiSoundcloud, SiSpotify, SiVimeo, SiYoutube } from "react-icons/si";
import { ExternalLinkIcon } from "./AppIcons";

const REFERENCE_SERVICE_LOGOS = {
  generic: {
    Icon: ExternalLinkIcon,
    className: "is-generic",
    label: "Reference",
  },
  soundcloud: {
    Icon: SiSoundcloud,
    className: "is-soundcloud",
    label: "SoundCloud",
  },
  spotify: {
    Icon: SiSpotify,
    className: "is-spotify",
    label: "Spotify",
  },
  vimeo: {
    Icon: SiVimeo,
    className: "is-vimeo",
    label: "Vimeo",
  },
  youtube: {
    Icon: SiYoutube,
    className: "is-youtube",
    label: "YouTube",
  },
};

export default function ReferenceServiceLogo({ className = "", isLarge = false, platform, platformLabel }) {
  const config = REFERENCE_SERVICE_LOGOS[platform] || REFERENCE_SERVICE_LOGOS.generic;
  const Icon = config.Icon;
  const label = platformLabel || config.label;

  return (
    <span className={`search-result-thumbnail search-service-logo ${isLarge ? "is-large" : ""} ${config.className} ${className}`} aria-label={`${label} reference`} title={label}>
      <Icon aria-hidden="true" focusable="false" />
    </span>
  );
}
