# astro-port: Setup & Project Guide

Everything you need to run this portfolio locally, set up the EmDash CMS, and deploy it to Cloudflare.

> **Status:** the code was written from EmDash's official `portfolio-cloudflare` template (emdash `0.41.0`, Astro `7.3`) but has **not been installed or run yet**. Your first `pnpm install && pnpm dev` is its first real test. See [Troubleshooting](#10-troubleshooting) if anything fails.

---

## 1. What this project is

A dark, minimal developer portfolio with a blog, built from the design in [`portfolio_plan.md`](portfolio_plan.md).

| Piece | What it does |
| --- | --- |
| **Astro 7** | Renders every page on the server at request time |
| **EmDash CMS** | Admin panel at `/_emdash/admin`, with content, media library, menus and taxonomies |
| **Cloudflare Workers** | Hosts the site (one Worker serves both the site and the admin) |
| **Cloudflare D1** | SQLite database holding all content |
| **Cloudflare R2** | Storage for uploaded images and your CV |

Because content lives in a database, **writing a post or editing a project goes live immediately. No rebuild or git push needed.** Code changes still go through git.

### Pages

| URL | Page |
| --- | --- |
| `/` | Hero (name, intro, Download CV, Copy email, socials, live globe) → stat tiles → Work → Projects (with live demo panels) → Writing (latest posts) → Stack → Contact |
| `/posts` | All blog posts |
| `/posts/<slug>` | A blog post, with a reading progress bar |
| `/projects` | All projects |
| `/projects/<slug>` | A project case study, with live/GitHub links |
| `/rss.xml` | RSS feed of posts |
| `/sitemap.xml`, `/robots.txt` | Generated automatically by EmDash |
| `/_emdash/admin` | The CMS admin panel |

---

## 2. Prerequisites (on your PC)

- **Node.js 22.16 or newer** (`node -v` to check). The repo has a `.node-version` file for nvm/fnm users.
- **pnpm** (recommended; the EmDash templates use it). Easiest way to get it:
  ```bash
  corepack enable
  ```
  npm also works. Replace `pnpm` with `npm run` in the commands below (`npm install`, `npm run dev`, …).
- **Git**
- **A Cloudflare account** (free plan is fine). You only need it for deploying, not for local development.
- A browser that supports **passkeys** (any modern Chrome, Edge, Safari or Firefox). EmDash admin login uses passkeys.

---

## 3. Run it locally

```bash
git clone https://github.com/IsmailAbbasi/astro-port.git
cd astro-port
pnpm install
pnpm dev
```

Then:

1. Open **http://localhost:4321/_emdash/admin** and complete the **setup wizard**:
   - Site title and tagline
   - Your email and name
   - Register a **passkey** (this is how you log in from now on)
2. During setup EmDash creates the database and applies [`seed/seed.json`](seed/seed.json), which holds the schema plus sample content.
3. Open **http://localhost:4321** to see the site.

**No Cloudflare account is needed locally.** `astro dev` runs the real Workers runtime on your machine with a local D1 database and R2 bucket, stored in `.wrangler/state/` (git-ignored).

When you first start the dev server, EmDash also regenerates `emdash-env.d.ts` (TypeScript types for the collections). That's expected. Commit the regenerated file.

> **Commit the lockfile.** `pnpm install` creates `pnpm-lock.yaml`. Commit it: Cloudflare's build uses it to pick pnpm and exact versions.

### Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server at http://localhost:4321 |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build locally |
| `pnpm typecheck` | Type-check the project (`astro check`) |
| `pnpm deploy` | Build and deploy to Cloudflare |
| `npx emdash types` | Regenerate `emdash-env.d.ts` from the running dev server |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` (after changing `wrangler.jsonc` bindings) |

---

## 4. Set up your content in EmDash

Everything visible on the site is edited in the admin panel. The seed creates **sample content**. Replace or delete it.

### 4.1 Profile (hero section)

Admin sidebar → **Profile** → open the single entry → edit → **Publish**.

| Field | Where it shows |
| --- | --- |
| **Name** | The big name in the hero and the top bar. With three or more words, the first ones sit small above the last two (e.g. `Mohd Ismail Abbasi`) |
| **Role** | Amber label above the name, plus the default page description |
| **Email** | The contact section and the **Copy email** buttons |
| **Bio** | The large italic intro under the name. Keep it to one or two sentences. **Bold text is highlighted in amber**, e.g. bold "satellite telemetry", "payments" and "ball-by-ball cricket" |
| **Available for work** | Shows a green "Open to work" label in the hero |
| **CV (PDF)** | The **Download CV** button. Upload your PDF here |
| **Hire Me link** | Optional (e.g. a Cal.com or contact-form URL). Adds a "Hire me" row to the contact section |
| **X / Bento / GitHub / LinkedIn URLs** | Links in the hero and the contact section (empty ones are hidden). Paste full URLs, e.g. `https://x.com/yourhandle` |

The rest of the home page copy (work history, the four stat tiles, the "Now" line, section titles, project bullet points and spec rows) isn't in the CMS. Edit it in [`src/data/site.ts`](src/data/site.ts).

Keep exactly **one** published Profile entry.

> **CV alternative:** if you'd rather keep the CV in git, leave the CV field empty and put the file at `public/cv.pdf`. The button falls back to `/cv.pdf`.

### 4.2 Posts (blog)

Sidebar → **Posts** → **New**.

- **Title**, **Excerpt** (shown on cards), optional **Cover image**, **Content**.
- The editor's add-block menu has headings, lists, quotes, **code blocks**, tables and images.
- **Save** keeps a draft; **Publish** makes it live. You can also schedule a post.
- **Tags** can be added per post (manage them under the Tags taxonomy).
- The home page shows the **2 most recent** posts.

### 4.3 Projects

Sidebar → **Projects** → **New**.

- **Title**, **Short description** (the italic line under the name), **Year**, **Live URL**, **GitHub URL**.
- **Technologies**: pick terms (React, Astro, …) from the taxonomy panel. They show as `React · Astro` under the project. Add new ones under the **Technologies** taxonomy.
- **Show on home page**: untick to hide a project from the home page (it still shows on `/projects`).
- **Cover image** (optional): shown in a panel next to the project when it has no live demo.
- **Case study** (optional): the body of `/projects/<slug>`.
- **Live demo panels**: projects titled **Intercept API**, **ExaminateAI** and **CricStack** (or with those slugs) get the matching live sample, bullet points and spec rows from [`src/data/site.ts`](src/data/site.ts). Case, spaces and dashes are ignored when matching.

### 4.4 Tech Stack

Sidebar → **Tech Stack** → **New**.

- **Name** and **Category** (Frontend / Backend / Database / DevOps / Tools). Each category is one row of the "What I build with" table. The row names and "Used for" text (Frontend → "Interfaces", …) are set in [`src/data/site.ts`](src/data/site.ts), which also adds an "AI" row.
- **Simple Icons slug** and **Custom icon** are not shown in the current design (the table lists names only).

### 4.5 Navigation, settings and SEO

- **Menus → Primary Navigation**: the top bar always shows Work, Projects, Blog, Stack and Contact. Other items you add here (anything except `/` and `/posts`) appear before Contact.
- **Settings → General**: site title (used in browser tabs), tagline, logo, **favicon**. The repo ships a fallback at `public/favicon.svg`.
- **Settings → SEO**: title separator, default social share image, search-engine verification, `robots.txt` content.
- Each post and project has an **SEO panel** for a custom title, description and share image.

### 4.6 Important: the seed only runs once

`seed/seed.json` is applied **only to an empty database** during first setup. Editing it later does **not** change an existing site. After setup, change content in the admin.

To start over **locally**, stop the dev server and delete `.wrangler/state/`. That wipes your local database and uploads. Never do this to production.

---

## 5. Deploy to Cloudflare

EmDash's Cloudflare setup (and Astro's Cloudflare adapter) deploy to **Cloudflare Workers**. Workers Builds is the Workers equivalent of "connect the repo to Cloudflare Pages" in the original plan, so pushes still auto-deploy.

### 5.1 First deploy (from your PC)

```bash
pnpm wrangler login     # opens the browser to authorise Wrangler
pnpm deploy             # = astro build && wrangler deploy
```

On the first deploy Wrangler **creates the D1 database (`astro-port`) and the R2 bucket (`astro-port-media`)** named in [`wrangler.jsonc`](wrangler.jsonc). Later deploys reuse them.

Wrangler prints a URL like `https://astro-port.<your-subdomain>.workers.dev`. Then:

1. Open `https://astro-port.<your-subdomain>.workers.dev/_emdash/admin`.
2. Run the **setup wizard again**. Production has its own database, separate from your local one, and gets the seed on first setup.
3. Register a passkey. Passkeys are tied to the domain, so the one from localhost won't work in production (and a custom domain needs its own later).
4. Fill in your Profile, posts and projects (section 4).

> **Want your local content in production?** Before the *first* production setup, export your local site into a seed:
> ```bash
> mkdir -p .emdash
> npx emdash export-seed --with-content=all > .emdash/seed.json
> ```
> EmDash prefers `.emdash/seed.json` over `seed/seed.json`, so commit it and deploy. Uploaded media (CV, images) is not guaranteed to come along, so re-upload it in production. Content-only is the safe assumption.

### 5.2 Auto-deploy on every push (Workers Builds)

After the first deploy has created the Worker:

1. Cloudflare dashboard → **Workers & Pages** → select **astro-port** → **Settings** → **Builds** → **Connect**.
2. Choose your GitHub account and the `astro-port` repo.
3. Settings:
   - **Git branch:** `main`
   - **Build command:** `pnpm run build`
   - **Deploy command:** `npx wrangler deploy` (the default)
   - **Root directory:** leave empty
4. Save. From now on every `git push` to `main` builds and deploys.

The Worker name in the dashboard must match `"name"` in `wrangler.jsonc` (`astro-port`), or the build fails. If the build complains about the Node version, add a build variable `NODE_VERSION` = `22` (Settings → Build variables and secrets).

### 5.3 Custom domain

The domain must be on Cloudflare (same account). After the `workers.dev` URL works, either:

- Dashboard → your Worker → **Settings** → **Domains & Routes** → **Add** → Custom domain, **or**
- uncomment the `routes` line in `wrangler.jsonc`, set your domain, and deploy again.

SSL is automatic. Visit `https://yourdomain.com/_emdash/admin` and register a passkey for the new domain (see 5.1, step 3).

### 5.4 Secrets (optional)

`EMDASH_ENCRYPTION_KEY` only encrypts **plugin** settings marked secret. This site uses no such plugins, so you can skip it. If you add plugins later:

```bash
npx emdash secrets generate                    # prints emdash_enc_v1_...
pnpm wrangler secret put EMDASH_ENCRYPTION_KEY # paste it
```

Keep a copy somewhere safe: database backups don't include it. For local dev, copy `.dev.vars.example` to `.dev.vars`.

### 5.5 Good to know

- **Email isn't configured by default** on Workers. Passkey login works without it; magic links and invitations need an email plugin (see the [EmDash Cloudflare guide](https://docs.emdashcms.com/deployment/cloudflare/#email)).
- **Image resizing** uses Cloudflare Images transformations (free tier: 5,000 unique transformations/month; plenty for a portfolio).
- The **cron trigger** (`* * * * *`) runs scheduled publishing and maintenance. Keep it.
- **Sandboxed/marketplace plugins** need the Workers paid plan (see the commented `worker_loaders` line in `wrangler.jsonc`).

---

## 6. Project structure

```
astro-port/
├── astro.config.mjs        Astro + EmDash (D1/R2) config, Google fonts
├── wrangler.jsonc          Worker name, D1 + R2 bindings, cron, custom domain
├── package.json            Scripts and dependencies
├── seed/seed.json          Schema + sample content (first run only)
├── emdash-env.d.ts         Collection types (regenerated by `pnpm dev`)
├── worker-configuration.d.ts  Cloudflare binding types (`pnpm cf-typegen`)
├── Ismail Abbasi (1).html  The design reference. Keep it: the globe reads its map dots from it
├── public/
│   └── favicon.svg         Fallback favicon (put cv.pdf here if not using the admin upload)
└── src/
    ├── worker.ts           Worker entry (EmDash handler + scheduled jobs)
    ├── live.config.ts      EmDash loader registration (boilerplate)
    ├── layouts/Base.astro  <head>, theme script, EmDash hooks, top bar, footer, toast, scroll reveal
    ├── components/
    │   ├── Navbar.astro    Top bar: call sign, links, AOS/LOS light, clock, theme toggle, mobile menu
    │   ├── ThemeToggle.astro  Light/dark button
    │   ├── Hero.astro      Name, intro, Download CV / Copy email, socials, globe
    │   ├── Globe.astro     The live orbit globe
    │   ├── StatStrip.astro The four tiles under the hero
    │   ├── WorkLog.astro   Work history
    │   ├── ProjectPayload.astro  A project on the home page, with its demo or cover
    │   ├── demos/          Live sample panels: Intercept API, ExaminateAI, CricStack
    │   ├── BlogCard.astro  A post in a list
    │   ├── ProjectRow.astro  A project on /projects
    │   ├── StackTable.astro  "What I build with" table
    │   ├── Contact.astro   Email and channels
    │   ├── SectionHead.astro  Eyebrow + title + intro used by every section
    │   ├── TechBadge.astro No longer used by the design; safe to delete
    │   └── Footer.astro
    ├── data/site.ts        Home page copy the CMS has no fields for
    ├── scripts/            Globe, orbit model, theme, mount() lifecycle helper
    ├── pages/
    │   ├── index.astro     Home
    │   ├── posts/index.astro, posts/[slug].astro
    │   ├── projects/index.astro, projects/[slug].astro
    │   ├── rss.xml.ts
    │   └── 404.astro
    ├── lib/
    │   ├── profile.ts      Profile query, CV URL, social links, safe URLs
    │   └── format.ts       Dates and reading time
    └── styles/global.css   Design tokens (dark + light) + shared styles
```

Also included for AI coding tools on your PC: `AGENTS.md`, EmDash agent skills in `.agents/skills/` (linked as `.claude/skills`), and `.mcp.json` / `.vscode/mcp.json` / `.cursor/mcp.json`, which connect Claude Code, VS Code and Cursor to the EmDash docs server.

---

## 7. Customising the design

The design comes from `Ismail Abbasi (1).html`: a dark "mission control" look with an amber accent, plus a light theme.

- **Colours:** the tokens at the top of [`src/styles/global.css`](src/styles/global.css). `:root` is the dark theme, `:root[data-theme="light"]` the light one. Change both when you change a colour. In light mode the amber and green are darker so small text stays readable.
- **Theme toggle:** the button in the top bar. Visitors start on their OS setting; a click is remembered in their browser.
- **Fonts:** `fonts` in [`astro.config.mjs`](astro.config.mjs): **Archivo** (text and wide headings), **Martian Mono** (labels) and **Newsreader** (italic intros). The headings use Archivo's width axis (`font-stretch: 125%`).
- **Home page copy:** [`src/data/site.ts`](src/data/site.ts).
- **Animations:**
  - Scroll reveal: add `data-reveal` to any element (optionally `style="--reveal-delay: 120ms"`).
  - Page transitions: the `@view-transition` rule in `global.css`, plus Astro's ClientRouter for logged-out visitors.
  - The globe and demos pause off screen, and everything respects the OS "reduce motion" setting.
- **Home page section order:** [`src/pages/index.astro`](src/pages/index.astro).

### Adding a field to the CMS

1. In the admin: **Content Types** → pick a collection → add the field (this changes the live database schema).
2. Use it in the page code: `entry.data.<field_slug>`.
3. Run `npx emdash types` (or restart `pnpm dev`) to refresh the types.
4. Optionally mirror the change in `seed/seed.json` so fresh installs get it too.

For a deployed site, see EmDash's [schema evolution guide](https://docs.emdashcms.com/deployment/schema-evolution/).

---

## 8. Changes from `portfolio_plan.md`

| Plan said | What was built | Why |
| --- | --- | --- |
| Scaffold with `npm create emdash@latest … --template portfolio` | Project files written by hand, based on that template's Cloudflare variant | Nothing could be installed or run on this machine. The files match what the scaffold produces, plus the custom design |
| Cloudflare **Pages** | Cloudflare **Workers** (+ Workers Builds for git auto-deploy) | EmDash's Cloudflare templates and Astro's Cloudflare adapter now deploy to Workers |
| Astro View Transitions | Native browser cross-document View Transitions (`@view-transition`) | Astro's `<ClientRouter />` swaps pages without a real load, which can stop EmDash's injected scripts (visual editing, plugins) from running. The native version needs no JS. Chrome, Edge and Safari 18.2+ animate it; other browsers just navigate normally |
| `@astrojs/sitemap` | EmDash's built-in `/sitemap.xml` | `@astrojs/sitemap` only covers pre-rendered pages. EmDash generates sitemaps for the SEO-enabled collections (posts, projects) |
| Bio + social links in "Global Settings" | A **Profile** collection (one entry) | EmDash's built-in Social settings have no Bento field and no place for a CV, bio or Hire Me link. Everything for the hero is in one place |
| Projects `technologies` (tags) | A **Technologies** taxonomy on projects | Reusable terms you pick from, managed in the admin |
| Tech Stack `icon` (SVG/image) | **Simple Icons slug** plus an optional custom image upload | No need to upload 15 logos: type `react` and done |
| Project detail page optional | `/projects/<slug>` and a `/projects` index included | Rows link to a case study; ↗ and GitHub icons link out |
| Lighthouse 95+ | A target, **not yet measured** | Measure after the first deploy |

---

## 9. Before you go live: checklist

- [ ] Profile: name, role, **real email**, bio, CV uploaded, social URLs
- [ ] Delete or replace the sample posts ("Hello, world", "How this portfolio is built", "Writing posts in EmDash")
- [ ] Replace the two sample projects ("Analytics Dashboard", "Realtime Chat")
- [ ] Tech Stack: remove what you don't use, add what you do
- [ ] Settings → General: site title / tagline / favicon
- [ ] Settings → SEO: default share image
- [ ] Custom domain + passkey registered on it

---

## 10. Troubleshooting

**`pnpm install` warns about ignored build scripts.**
`pnpm-workspace.yaml` already allows the ones needed (`esbuild`, `workerd`). If pnpm still blocks something, run `pnpm approve-builds`.

**Install fails with version-resolution errors.**
The versions in `package.json` match the EmDash template as of Sept 2026. `pnpm-workspace.yaml` also holds back packages published less than 24h ago (EmDash itself is exempt). If a version can't be found, update to the latest: `pnpm up emdash @emdash-cms/cloudflare astro @astrojs/cloudflare @astrojs/react wrangler --latest`.

**The first page load errors about the seed.**
Check the terminal. EmDash validates `seed/seed.json` on first run and names the problem. Fix it, delete `.wrangler/state/`, and restart `pnpm dev`.

**Type errors about collections (`profile`, `stack`, …).**
Start `pnpm dev` once so EmDash regenerates `emdash-env.d.ts`, or run `npx emdash types` while it's running. Then `pnpm typecheck`.

**The admin says setup is done but the home page is empty.**
Content must be **published**, not just saved as a draft.

**Download CV gives a 404.**
Upload a PDF in Profile → CV, or add `public/cv.pdf`.

**A tech badge has no icon.**
The Simple Icons slug is wrong or that brand isn't on simpleicons.org. Check the slug there, or upload a custom icon.

**"D1 binding not found" / "R2 binding not found".**
The binding names in `wrangler.jsonc` (`DB`, `MEDIA`) must match `d1({ binding: "DB" })` / `r2({ binding: "MEDIA" })` in `astro.config.mjs`.

**Production errors.**
`pnpm wrangler tail` streams the live Worker logs.

---

## 11. References

- EmDash docs: https://docs.emdashcms.com/ (getting started, [Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/), [secrets](https://docs.emdashcms.com/deployment/secrets/))
- EmDash templates (this project is based on `portfolio-cloudflare`): https://github.com/emdash-cms/templates
- Astro + EmDash guide: https://docs.astro.build/en/guides/cms/emdash/
- Cloudflare Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Simple Icons: https://simpleicons.org
