# Portfolio Build Plan — Astro + EmDash CMS

> **Goal:** Build a premium, minimal, dark-mode portfolio website with blog support, hosted on **Cloudflare Pages**.

---

## Design Direction (Based on Reference)

The design follows a **clean, content-first, dark-mode** aesthetic inspired by the reference screenshot:

```
┌─────────────────────────────────────────────────┐
│  email@domain.com              Home / Posts      │  ← Minimal Navbar
├─────────────────────────────────────────────────┤
│                                                  │
│  Hi, I'm Ismail 👋                              │  ← Hero with greeting
│                                                  │
│  Short bio with highlighted keywords             │
│  (role, tech stack, years of experience)         │
│                                                  │
│  [Download CV ↓]  [Hire Me →]                   │  ← CTA Buttons
│                                                  │
│  X / Bento / GitHub / LinkedIn                   │  ← Social Links
│                                                  │
├─────────────────────────────────────────────────┤
│  Latest Posts                    See all posts → │
│  ┌──────────────────┐ ┌──────────────────┐      │
│  │ Post Title  Date │ │ Post Title  Date │      │  ← Blog Cards (from EmDash)
│  │ Excerpt...       │ │ Excerpt...       │      │
│  └──────────────────┘ └──────────────────┘      │
├─────────────────────────────────────────────────┤
│  Selected Projects (N)                           │
│  ┌─────────────────────────────────────────┐    │
│  │ Project Name     Tech • Tech         ↗  │    │  ← Project Rows
│  ├─────────────────────────────────────────┤    │
│  │ Project Name     Tech • Tech         ↗  │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  Tech Stack                                      │
│  [React] [Astro] [TypeScript] [Node] [Python]   │  ← Badges / Bento Grid
├─────────────────────────────────────────────────┤
│  Footer — © 2024 · Built with Astro + EmDash    │
└─────────────────────────────────────────────────┘
```

**Key additions over the reference:**
- **Download CV button** in the hero section
- **Tech Stack section** with animated badges
- **Scroll reveal animations** & **Astro View Transitions** for page navigation
- **Premium micro-interactions** (hover glow, card elevation, subtle gradients)

---

## Phase 1: Project Setup

### 1.1 Scaffold with EmDash
```bash
npm create emdash@latest my-portfolio -- --template portfolio --platform cloudflare --yes
```
- EmDash comes with a **built-in admin panel** (`/_emdash/admin`) — no separate CMS hosting needed.
- It creates the Astro project, database, and admin UI all in one.

### 1.2 Project Structure
```
my-portfolio/
├── public/
│   └── cv.pdf                  ← Your downloadable CV
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── Hero.astro          ← Intro + Download CV + Socials
│   │   ├── BlogCard.astro
│   │   ├── ProjectRow.astro
│   │   ├── TechBadge.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Base.astro          ← Global layout (fonts, meta, transitions)
│   ├── pages/
│   │   ├── index.astro         ← Home (Hero + Posts + Projects + Stack)
│   │   ├── posts/
│   │   │   ├── index.astro     ← All blog posts
│   │   │   └── [slug].astro    ← Individual blog post
│   │   └── projects/
│   │       └── [slug].astro    ← Individual project detail
│   └── styles/
│       └── global.css          ← Design system (colors, typography, animations)
├── astro.config.mjs
└── package.json
```

---

## Phase 2: EmDash CMS Schema

All content is managed through the EmDash admin panel — no code changes needed to add/edit content.

### Collections to Create:

| Collection    | Fields                                                                                    |
|---------------|------------------------------------------------------------------------------------------|
| **Posts**      | `title`, `slug`, `excerpt`, `coverImage`, `publishDate`, `content` (rich text blocks)    |
| **Projects**   | `title`, `slug`, `description`, `technologies` (tags), `liveUrl`, `githubUrl`, `coverImage`, `content` |
| **Tech Stack** | `name`, `icon` (SVG/image), `category` (Frontend / Backend / Tools / DevOps)             |

### Global Settings (via EmDash):
- Site title, bio text, social links (X, GitHub, LinkedIn, Bento)
- CV file (uploaded via media library)

---

## Phase 3: UI/UX Implementation

### 3.1 Design System (`global.css`)
```
Colors (Dark Mode First):
  --bg-primary:      hsl(220, 15%, 8%)       ← Deep dark background
  --bg-card:         hsl(220, 15%, 12%)      ← Elevated card surfaces
  --bg-card-hover:   hsl(220, 15%, 16%)      ← Card hover state
  --text-primary:    hsl(0, 0%, 92%)         ← Main text
  --text-secondary:  hsl(0, 0%, 60%)         ← Muted text
  --accent:          hsl(35, 95%, 55%)       ← Warm amber accent (like the reference)
  --accent-gradient: linear-gradient(135deg, hsl(35,95%,55%), hsl(15,90%,55%))
  --border:          hsl(220, 15%, 18%)      ← Subtle borders

Typography:
  Font: "Inter" or "Plus Jakarta Sans" from Google Fonts
  H1: 2.5rem, font-weight 700
  Body: 1rem, font-weight 400, line-height 1.7
```

### 3.2 Component Breakdown

| Component        | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **Navbar**        | Minimal — email on left, `Home / Posts` links on right                      |
| **Hero**          | Greeting with emoji, bio with highlighted keywords, **Download CV** button, social links |
| **BlogCard**      | Dark card with title, date, excerpt. Subtle border + hover glow            |
| **ProjectRow**    | Full-width row with project name, tech tags, and external link arrow (↗)   |
| **TechBadge**     | Pill-shaped badge with icon + name. Grouped by category in a bento grid    |
| **Footer**        | Simple copyright line                                                      |

### 3.3 Premium Animations & Interactions
- **Scroll Reveal**: Content fades + slides up as user scrolls (using Intersection Observer)
- **Astro View Transitions**: Seamless cross-fade when navigating between pages (no full reload)
- **Hover Effects**: Cards slightly elevate with a soft glow on hover; buttons scale up
- **Highlighted Keywords**: Key terms in the bio (role, technologies) will be styled with the accent color
- **Download CV Button**: Styled as a prominent CTA, links to `/cv.pdf` with `download` attribute

---

## Phase 4: Pages Detail

### Home Page (`/`)
1. **Navbar** — email + nav links
2. **Hero Section** — "Hi, I'm Ismail 👋" + bio + **[Download CV]** + **[Hire Me]** buttons + social links
3. **Latest Posts** — 2-3 most recent blog posts from EmDash, with "See all posts →" link
4. **Selected Projects** — List of featured projects as clean rows with tech tags
5. **Tech Stack** — Grid/bento layout of technology badges grouped by category
6. **Footer**

### Blog List (`/posts`)
- All posts from EmDash, sorted by date, with cards showing title + excerpt + date

### Blog Post (`/posts/[slug]`)
- Full article rendered from EmDash rich text blocks
- Reading progress bar at top
- "Back to posts" navigation

### Project Detail (`/projects/[slug]`) *(optional — can just link externally)*
- Full case study with screenshots, description, and links

---

## Phase 5: Cloudflare Deployment

> [!TIP]
> EmDash was built **by Cloudflare** and is designed to deploy natively on Cloudflare Pages + D1 database.

### 5.1 Deployment Steps
1. Push code to a **GitHub repository**
2. Connect the repo to **Cloudflare Pages** (via the Cloudflare dashboard)
3. Cloudflare automatically:
   - Builds the Astro site
   - Provisions a **D1 database** (SQLite at the edge) for EmDash content
   - Deploys to the global CDN
4. Access the admin at `yourdomain.com/_emdash/admin`

### 5.2 Custom Domain
- Add your custom domain in Cloudflare Pages settings
- SSL is automatic and free

### 5.3 CI/CD
- Every `git push` to `main` triggers a new build and deploy automatically
- Content changes in EmDash admin are **live instantly** (server-rendered, no rebuild needed)

---

## Phase 6: SEO & Performance

- **Dynamic Meta Tags**: Title, description, OG image generated per page from EmDash data
- **Sitemap**: Auto-generated `sitemap.xml` using `@astrojs/sitemap`
- **RSS Feed**: Auto-generated RSS for blog posts
- **Performance Target**: Lighthouse 95+ across all categories
- **Image Optimization**: Astro's `<Image />` component for responsive, WebP images

---

## Summary: What I Build vs. What You Do

| I Build (Code)                                | You Do (Content)                              |
|-----------------------------------------------|-----------------------------------------------|
| Scaffold Astro + EmDash project               | Add your CV PDF file                          |
| Create all pages, components, and styles      | Write your bio and social links in admin      |
| Wire up EmDash data fetching                  | Create blog posts in the admin panel          |
| Implement animations & View Transitions       | Add projects with descriptions & tech tags    |
| Configure Cloudflare deployment               | Push to GitHub & connect to Cloudflare Pages  |
| SEO, sitemap, RSS feed setup                  | Add your custom domain                        |

---

## Ready to Build?

Once you approve this plan, I will:
1. Run `npm create emdash@latest` with the `--template portfolio --platform cloudflare` flags
2. Build out all the components and pages with the dark, minimal design
3. Get you a running local dev server you can preview immediately
