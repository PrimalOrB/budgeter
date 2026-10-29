import React, { createContext, useContext, useEffect, useState } from "react";

// "system" follows the OS setting; the choice is remembered per browser
const STORAGE_KEY = "theme";
const PREFERENCES = ["system", "light", "dark"];

const ThemeContext = createContext({
  preference: "system",
  resolvedTheme: "light",
  setPreference: () => {},
  cyclePreference: () => {},
});

function readPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [system, setSystem] = useState(systemTheme);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(systemTheme());
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = preference === "system" ? system : preference;

  // applied during render (not in an effect) so child effects - charts
  // reading CSS variables - already see the new palette
  const root = document.documentElement;
  if (root.dataset.theme !== resolvedTheme) {
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // storage unavailable (private mode) - theme still applies this session
    }
  }, [preference]);

  const cyclePreference = () =>
    setPreference(
      PREFERENCES[(PREFERENCES.indexOf(preference) + 1) % PREFERENCES.length]
    );

  return (
    <ThemeContext.Provider
      value={{ preference, resolvedTheme, setPreference, cyclePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// "#059669" / "rgb(5, 150, 105)" -> rgba with the given alpha
export function withAlpha(color, alpha) {
  const hex = String(color).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let value = hex[1];
    if (value.length === 3) {
      value = value.split("").map((c) => c + c).join("");
    }
    const n = parseInt(value, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = String(color).match(/\d+(\.\d+)?/g);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : color;
}

// vertical fade from `top` alpha down to nothing
export const fade = (color, top) => (context) => {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) {
    return withAlpha(color, top / 2);
  }
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, withAlpha(color, top));
  gradient.addColorStop(1, withAlpha(color, top * 0.1));
  return gradient;
};

// read the current palette from CSS custom properties, for chart.js
export function getChartColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim();
  return {
    income: read("--income"),
    incomeSoft: read("--income-soft"),
    expense: read("--expense"),
    expenseSoft: read("--expense-soft"),
    text: read("--text"),
    muted: read("--text-muted"),
    surface: read("--surface"),
    border: read("--border"),
    accent: read("--accent"),
    transfer: read("--transfer"),
  };
}
