import * as React from "react";
import {
  Check,
  Circle,
  Edit3,
  Pause,
  Play,
  RefreshCcw,
  Settings,
  Square,
  Star,
  Trash2,
  X,
} from "lucide-react";

const { memo } = React;

const DEFAULT_ICON_PROPS = {
  "aria-hidden": true,
  focusable: "false",
  size: 20,
  strokeWidth: 2.4,
};

function createIcon(Component, defaultProps = {}) {
  function AppIcon(props) {
    return <Component {...DEFAULT_ICON_PROPS} {...defaultProps} {...props} />;
  }

  return memo(AppIcon);
}

const CheckIcon = createIcon(Check);
const EditIcon = createIcon(Edit3);
const PauseIcon = createIcon(Pause);
const PlayIcon = createIcon(Play, {
  fill: "currentColor",
});
const RecordIcon = createIcon(Circle, {
  fill: "currentColor",
});
const ReplayIcon = createIcon(RefreshCcw);
const SettingsIcon = createIcon(Settings);
const StarIcon = createIcon(Star);
const StopIcon = createIcon(Square, {
  fill: "currentColor",
});
const TrashIcon = createIcon(Trash2);
const XIcon = createIcon(X);

export {
  CheckIcon,
  EditIcon,
  PauseIcon,
  PlayIcon,
  RecordIcon,
  ReplayIcon,
  SettingsIcon,
  StarIcon,
  StopIcon,
  TrashIcon,
  XIcon,
};
