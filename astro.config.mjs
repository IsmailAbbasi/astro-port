import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	site: "https://ismailabbasi.in",
	// EmDash content is read at request time, so every page is server-rendered.
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		// Required: the EmDash admin UI at /_emdash/admin is a React app.
		react(),
		emdash({
			// Binding names must match wrangler.jsonc.
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	// Variable fonts. The design uses in-between weights (e.g. 640, 760) and
	// the width axis (font-stretch up to 125% on headings), so request the
	// full ranges. If headings look narrow, check that the "wdth" axis came
	// through; the fallback is the design file's Google Fonts <link>.
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Archivo",
			cssVariable: "--font-sans",
			weights: ["100 900"],
			styles: ["normal"],
			fallbacks: ["sans-serif"],
			options: { experimental: { variableAxis: { wdth: [["62", "125"]] } } },
		},
		{
			provider: fontProviders.google(),
			name: "Martian Mono",
			cssVariable: "--font-mono",
			weights: ["100 800"],
			styles: ["normal"],
			fallbacks: ["monospace"],
			options: { experimental: { variableAxis: { wdth: [["75", "112.5"]] } } },
		},
		{
			provider: fontProviders.google(),
			name: "Newsreader",
			cssVariable: "--font-serif",
			weights: ["300 600"],
			styles: ["normal", "italic"],
			fallbacks: ["serif"],
			options: { experimental: { variableAxis: { opsz: [["6", "72"]] } } },
		},
	],
	devToolbar: { enabled: false },
});
