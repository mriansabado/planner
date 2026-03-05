import { useEffect, useState } from "react";

const STORAGE_KEY = "freelance-planner-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      className="btn-icon theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
