import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "default",
  mode: "light",
  setTheme: () => null,
  setMode: () => null,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "default";
    }
    return "default";
  });

  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mode") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Set the data-theme and data-mode attributes
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", mode);
    
    // Store the theme and mode in localStorage
    localStorage.setItem("theme", theme);
    localStorage.setItem("mode", mode);
  }, [theme, mode]);

  const value = {
    theme,
    mode,
    setTheme: (theme) => {
      setTheme(theme);
    },
    setMode: (mode) => {
      setMode(mode);
    },
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const themes = [
  "default",
  "ocean",
  "retro",
  "caffeine",
  "midnight",
  "vintage",
]; 