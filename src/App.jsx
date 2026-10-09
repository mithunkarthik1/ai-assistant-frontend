import { useState, useEffect } from "react";
import AuthPage from "./components/auth/AuthPage";
import Dashboard from "./Dashboard";
import { getCurrentUser, logoutUser } from "./services/authService";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  // Global application theme state: "dark" | "light"
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_theme") || localStorage.getItem("ai_auth_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }
    return "dark";
  });

  // Apply theme to documentElement
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
      localStorage.setItem("ai_theme", theme);
      localStorage.setItem("ai_auth_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener("ai-assistant-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("ai-assistant-unauthorized", handleUnauthorized);
    };
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Strictly enforce authentication: no guest access
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        currentTheme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Dashboard
      currentUser={currentUser}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
