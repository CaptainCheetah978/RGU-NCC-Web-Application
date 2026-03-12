"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClass(theme: Theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Lazy initializer reads localStorage once on mount and immediately applies
    // the dark class to <html> to minimise the theme flash before first paint.
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("ncc_theme") as Theme | null;
            const resolved: Theme = stored === "dark" ? "dark" : "light";
            applyThemeClass(resolved);
            return resolved;
        }
        return "light";
    });

    // Keep the <html> class and localStorage in sync whenever the theme changes.
    useEffect(() => {
        applyThemeClass(theme);
        localStorage.setItem("ncc_theme", theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
