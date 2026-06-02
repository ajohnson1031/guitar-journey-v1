import {
  CalendarDays,
  Check,
  Circle,
  CirclePlus,
  CloudDownload,
  CloudUpload,
  Download,
  Edit3,
  Guitar,
  History,
  LayoutDashboard,
  ListMusic,
  Menu,
  Mic,
  MicOff,
  NotebookPen,
  NotebookText,
  Pause,
  PencilOff,
  Play,
  Plus,
  RefreshCcw,
  Repeat2,
  Save,
  Settings,
  Square,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import * as React from "react";

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

const CalendarDaysIcon = createIcon(CalendarDays);
const CheckIcon = createIcon(Check);
const CirclePlusIcon = createIcon(CirclePlus);
const CloudDownloadIcon = createIcon(CloudDownload);
const CloudUploadIcon = createIcon(CloudUpload);
const DashboardIcon = createIcon(LayoutDashboard);
const DownloadIcon = createIcon(Download);
const EditIcon = createIcon(Edit3);
const GuitarIcon = createIcon(Guitar);
const HistoryIcon = createIcon(History);
const ListMusicIcon = createIcon(ListMusic);
const MenuIcon = createIcon(Menu);
const MicIcon = createIcon(Mic);
const MicOffIcon = createIcon(MicOff);
const NotebookPenIcon = createIcon(NotebookPen);
const NotebookTextIcon = createIcon(NotebookText);
const PauseIcon = createIcon(Pause);
const PencilOffIcon = createIcon(PencilOff);
const PlayIcon = createIcon(Play, {
  fill: "currentColor",
});
const PlusIcon = createIcon(Plus);
const RecordIcon = createIcon(Circle, {
  fill: "currentColor",
});
const ReplayIcon = createIcon(RefreshCcw);
const RepeatIcon = createIcon(Repeat2);
const SaveIcon = createIcon(Save);
const SettingsIcon = createIcon(Settings);
const StarIcon = createIcon(Star);
const StopIcon = createIcon(Square, {
  fill: "currentColor",
});
const TrashIcon = createIcon(Trash2);
const UploadIcon = createIcon(Upload);
const XIcon = createIcon(X);

export {
  CalendarDaysIcon,
  CheckIcon,
  CirclePlusIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  DashboardIcon,
  DownloadIcon,
  EditIcon,
  GuitarIcon,
  HistoryIcon,
  ListMusicIcon,
  MenuIcon,
  MicIcon,
  MicOffIcon,
  NotebookPenIcon,
  NotebookTextIcon,
  PauseIcon,
  PencilOffIcon,
  PlayIcon,
  PlusIcon,
  RecordIcon,
  ReplayIcon,
  RepeatIcon,
  SaveIcon,
  SettingsIcon,
  StarIcon,
  StopIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
};
