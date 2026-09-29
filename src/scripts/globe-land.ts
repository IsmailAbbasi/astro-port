/**
 * Land dots for the hero globe, read at build time from the design file in
 * the project root ("Ismail Abbasi (1).html"). There they are stored as
 * `var LAND = "<base64>"`: little-endian int16 pairs of latitude×100 and
 * longitude×100.
 *
 * Keep that file in the repo. Without it the globe still works, just
 * without continents. Any .html file in the project root that contains the
 * data is used, so renaming it is fine.
 */

const files = import.meta.glob<string>("/*.html", { query: "?raw", import: "default", eager: true });

const LAND_RE = /var LAND = "([A-Za-z0-9+\/=]+)"/;

function findLand(): string {
	for (const html of Object.values(files)) {
		const match = LAND_RE.exec(html);
		if (match) return match[1];
	}
	return "";
}

export const LAND = findLand();
