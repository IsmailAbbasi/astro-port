This is an EmDash site: a CMS built on Astro with a full admin UI, deployed to Cloudflare Workers (D1 + R2). It is a personal developer portfolio with a blog.

Human setup instructions live in `SETUP.md`. The original design brief is `portfolio_plan.md`.

## Commands

```bash
pnpm dev              # Start the Astro dev server (http://localhost:4321)
pnpm build            # Production build
pnpm deploy           # Build + wrangler deploy
npx emdash types      # Regenerate emdash-env.d.ts from a running site
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key files

| File                        | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `astro.config.mjs`          | Astro config, `emdash()` integration (D1 + R2), fonts                    |
| `wrangler.jsonc`            | Worker name, D1/R2 bindings, cron trigger                                |
| `src/live.config.ts`        | EmDash loader registration (boilerplate, don't modify)                   |
| `src/worker.ts`             | Worker entry (EmDash handler + scheduled handler)                        |
| `seed/seed.json`            | Schema + starter content, applied on first run against an empty database |
| `emdash-env.d.ts`           | Generated collection types (regenerated on dev server start)             |
| `src/layouts/Base.astro`    | Layout with EmDash head/body wiring, theme script, top bar, footer       |
| `src/styles/global.css`     | Design tokens (dark + light themes) and shared styles                    |
| `src/data/site.ts`          | Hand-edited home page content the CMS has no fields for                  |
| `src/scripts/`              | Client scripts: globe, orbit model, theme, `mount()` lifecycle helper    |
| `src/lib/profile.ts`        | Profile query, CV URL and social-link helpers                            |

The visual design comes from `Ismail Abbasi (1).html` in the project root. Keep that file: `src/scripts/globe-land.ts` reads the globe's land dots from it at build time.

## Schema

- `profile` (not routable, one entry): `title` (name), `role`, `email`, `bio` (Portable Text; **bold** = highlighted keyword), `available`, `cv` (PDF file), `hire_url`, `x_url`, `bento_url`, `github_url`, `linkedin_url`.
- `posts` (`/posts/{slug}`): `title`, `excerpt`, `featured_image`, `content`. Taxonomy `tag`.
- `projects` (`/projects/{slug}`): `title`, `summary`, `year`, `live_url`, `github_url`, `featured` (show on home), `featured_image`, `content`. Taxonomy `tech`.
- `stack` (not routable): `title`, `category` (select: Frontend/Backend/Database/DevOps/Tools), `simple_icon` (Simple Icons slug), `icon` (image override).
- Menu `primary`: navbar links.

## Rules

- All pages are server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects, not strings. Render with `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for `getTermsForEntries`, etc.).
- Taxonomy names in queries must match the seed exactly: `"tag"` and `"tech"`.
- Pass query `cacheHint`s to `Astro.cache.set()` when `Astro.cache?.enabled`.
- `Base.astro` loads Astro's `<ClientRouter />` for logged-out visitors only; logged-in editors get normal page loads (with native `@view-transition`), so EmDash's visual editing runs normally. Because of ClientRouter, client scripts must start widgets with `mount()` from `src/scripts/lifecycle.ts`, which re-runs them after each navigation and stops their timers before the page is swapped.
- Theme: `data-theme="light" | "dark"` on `<html>`, set before first paint by the inline script in `Base.astro` (saved choice in `localStorage`, else the OS setting). Colours are tokens in `global.css`; never hard-code a colour in a component. Canvas code reads tokens and listens for the `themechange` event.
- Elements created by client scripts don't get Astro's scoped-style attributes, so style them in `<style is:global>` (see `src/components/demos/`).

## Skills & docs

Agent skills are in `.agents/skills/` (also linked from `.claude/skills`): **building-emdash-site**, **creating-plugins**, **emdash-cli**.

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp` (configured in `.mcp.json`, `.vscode/mcp.json`, `.cursor/mcp.json`). Verify APIs against the live docs rather than memory.
