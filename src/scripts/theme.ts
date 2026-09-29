/**
 * Light/dark theme. The inline script in Base.astro applies the theme before
 * the first paint; this module handles changes after that. A visitor's
 * choice is saved in localStorage. Until they choose, the site follows the
 * OS setting, live.
 *
 * Widgets that paint with theme colours (the globe canvas) listen for the
 * `themechange` event on document.
 */

export type Theme = "light" | "dark";

const KEY = "theme";
/** Browser UI colour per theme; matches --void in global.css (and Base.astro). */
const THEME_COLOR: Record<Theme, string> = { dark: "#070a15", light: "#f2eee3" };

export function storedTheme(): Theme | null {
	try {
		const value = localStorage.getItem(KEY);
		return value === "light" || value === "dark" ? value : null;
	} catch {
		return null;
	}
}

export function currentTheme(): Theme {
	return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const systemLight = window.matchMedia("(prefers-color-scheme: light)");

export function applyTheme(theme: Theme, remember = false): void {
	if (remember) {
		try {
			localStorage.setItem(KEY, theme);
		} catch {
			// Private mode or blocked storage: the choice lasts for this page only.
		}
	}
	if (theme === currentTheme()) return;
	document.documentElement.dataset.theme = theme;
	document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
	document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

// Follow the OS setting while the visitor hasn't picked a theme.
systemLight.addEventListener("change", () => {
	if (!storedTheme()) applyTheme(systemLight.matches ? "light" : "dark");
});
