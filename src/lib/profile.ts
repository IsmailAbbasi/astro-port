import { getEmDashCollection } from "emdash";
import type { Profile } from "../../emdash-env";

/**
 * The Profile collection holds a single entry that drives the hero,
 * navbar email, CV button and social links. Querying the first entry
 * (instead of a fixed slug) keeps it working if the slug is changed in
 * the admin.
 */
export async function getProfile() {
	const { entries, cacheHint } = await getEmDashCollection("profile", {
		orderBy: { published_at: "asc" },
		limit: 1,
	});
	return { profile: entries[0] ?? null, cacheHint };
}

/** Fallback when no CV has been uploaded in the admin: put a file at public/cv.pdf. */
export const DEFAULT_CV_PATH = "/cv.pdf";

/** Resolve a file-field value to a URL served by EmDash's media route. */
export function fileUrl(file: Profile["cv"] | undefined): string | undefined {
	if (!file) return undefined;
	if (file.url) return file.url;
	if (file.src) return file.src;
	const storageKey = typeof file.meta?.storageKey === "string" ? file.meta.storageKey : undefined;
	const key = storageKey || file.id;
	return key ? `/_emdash/api/media/file/${key}` : undefined;
}

/**
 * Read a boolean field. EmDash stores booleans as SQLite integers and
 * returns them as 0/1, so `value === false` checks (or `{value && ...}`
 * in a template, which would render "0") don't work. Unset fields use
 * `fallback`, matching the field's default in the seed.
 */
export function flag(value: unknown, fallback = false): boolean {
	if (value === null || value === undefined || value === "") return fallback;
	return value === true || value === 1 || value === "1" || value === "true";
}

/** Only allow http(s) links from CMS fields into href attributes. */
export function safeExternalUrl(value: string | undefined | null): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
	} catch {
		return undefined;
	}
}

export interface SocialLink {
	label: string;
	href: string;
}

/** Social links in the order shown in the hero; empty fields are skipped. */
export function getSocialLinks(profile: Profile | undefined | null): SocialLink[] {
	if (!profile) return [];
	const links: [string, string | undefined][] = [
		["X", profile.x_url],
		["Bento", profile.bento_url],
		["GitHub", profile.github_url],
		["LinkedIn", profile.linkedin_url],
	];
	return links.flatMap(([label, url]) => {
		const href = safeExternalUrl(url);
		return href ? [{ label, href }] : [];
	});
}
