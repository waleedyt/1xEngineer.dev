# [1xEngineer.dev](https://www.1xengineer.dev)

Personal engineering blog by Ahmed Waleed — thoughts on software engineering and team dynamics from personal experience.

## Stack

- **Astro 6** — static site generator with content collections and MDX support
- **Tailwind CSS 4** — CSS-first configuration via `@theme`; Solarized Light/Dark palette
- **MDX content collections** — posts live in `src/content/posts/`, typed via Zod schema
- **Giscus** — GitHub Discussions-backed comments (requires the Giscus GitHub App installed on the repo)
- **GoatCounter** — privacy-friendly, cookie-free analytics (replace `YOURCODE` in `src/components/Analytics.astro`)

## Dev commands

```bash
# Use Node 24+
nvm use 24

npm run dev       # start dev server at localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the production build locally
npm run check     # astro type-check
```

## Deploy

Output is fully static (`output: "static"`). Drop `dist/` on any static host:

- **Vercel** — connect the repo; Vercel detects Astro automatically
- **Cloudflare Pages** — build command `npm run build`, output dir `dist`
- **GitHub Pages** — use the official Astro GitHub Actions workflow

## Pending manual steps

1. Install the [Giscus GitHub App](https://github.com/apps/giscus) on this repository for comments to render.
2. Sign up at [goatcounter.com](https://www.goatcounter.com) and replace `YOURCODE` in `src/components/Analytics.astro` with your chosen site code.
