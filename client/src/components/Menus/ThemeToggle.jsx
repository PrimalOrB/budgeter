import React from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useTheme } from "../../utils/theme";

const ICONS = { light: FiSun, dark: FiMoon, system: FiMonitor };
const LABELS = { light: "Light", dark: "Dark", system: "System" };

const ThemeToggle = () => {
  const { preference, cyclePreference } = useTheme();
  const Icon = ICONS[preference];

  return (
    <button
      type="button"
      className="icon-button"
      onClick={cyclePreference}
      title={`Theme: ${LABELS[preference]} (click to change)`}
      aria-label={`Theme: ${LABELS[preference]}`}
    >
      <Icon />
    </button>
  );
};

export default ThemeToggle;
