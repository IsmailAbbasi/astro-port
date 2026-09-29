/**
 * Start widgets on every page view.
 *
 * Base.astro loads Astro's <ClientRouter /> for logged-out visitors, which
 * swaps pages without a full reload. Bundled scripts then run only once, so
 * a widget must start again after each swap (`astro:page-load`) and stop its
 * timers before the old page is removed (`astro:before-swap`). Logged-in
 * editors get normal page loads, where that event never fires and the direct
 * call in `mount` does the work.
 */

type Cleanup = () => void;

const cleanups: Cleanup[] = [];

document.addEventListener("astro:before-swap", () => {
	for (const cleanup of cleanups.splice(0)) {
		try {
			cleanup();
		} catch (error) {
			console.error(error);
		}
	}
});

/**
 * Call `setup` once for each element matching `selector`, now and after every
 * client-side navigation. `setup` may return a function that stops the widget.
 */
export function mount<T extends HTMLElement = HTMLElement>(selector: string, setup: (el: T) => Cleanup | void): void {
	const run = () => {
		for (const el of document.querySelectorAll<T>(selector)) {
			if (el.dataset.mounted === "1") continue;
			el.dataset.mounted = "1";
			const cleanup = setup(el);
			if (cleanup) cleanups.push(cleanup);
		}
	};
	run();
	document.addEventListener("astro:page-load", run);
}

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const pad = (n: number): string => (n < 10 ? "0" : "") + n;

/** "HH:MM:SS" at a fixed UTC offset (in minutes). */
export function clockString(offsetMinutes: number, at = Date.now()): string {
	const d = new Date(at + offsetMinutes * 60000);
	return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
