# Agent & Developer Guidelines (AGENT.md)
Personal blog of Ahmed Waleed.

This file is the agent-neutral source of truth for repository rules and conventions. It is exposed as `CLAUDE.md` (Claude Code), `AGENTS.md` (Codex), `GEMINI.md` (Gemini CLI), and `.agents/rules/workspace-rules.md` (Antigravity).

Reusable workflows live canonically in `.agents/skills/`. Platform-specific skill directories point there; do not maintain duplicate skill bodies. Shared reviewer personas live in `.agents/roles/`, with thin adapters under `.claude/agents/` and `.codex/agents/` where a harness requires its own format.

Astro 6 + Tailwind 4, MDX content collections, statically deployed to Vercel at https://www.1xengineer.dev. The priority is always: make writing and publishing posts easy. Keep the stack simple — no CMS, no database, no new runtime dependencies without a strong reason.

## Environment gotchas (will bite you)

- **Node**: node v24 is required. Validate that it is active if not, activate using `nvm install v24`
- **Git identity**: commits MUST be authored as `ch.aw.yt@gmail.com` (repo-local config, already set). 

## Commands

- `npm run dev` — dev server on localhost:4321 (restart it + `rm -rf .astro` if content mysteriously disappears after git branch switches)
- `npm run build` — static build to dist/
- `npm run check` — astro check (types + frontmatter validation)

## Ship policy

Never push directly to main. Every change ships as: branch → passing `astro check` + build → PR → green Vercel preview → squash-merge → verify on production. The step-by-step pipeline (including verification specifics and failure handling) lives in `.agents/skills/publish/SKILL.md` — use the `/publish` skill to ship, and follow that file even for ad-hoc changes shipped without it.

## Content model

Posts live in `src/content/posts/<slug>.mdx` — the filename IS the URL slug (`/posts/<slug>/`). Frontmatter schema (validated at build):

```yaml
title: Post Title
description: One-to-two sentence hook, ~155 chars, shown in search results and the homepage list.
date: 'YYYY-MM-DD'
image: '../../assets/images/<file>.jpg'   # hero, rendered by the layout — do NOT add an <Image> in the body
imageAlt: 'Accurate description of the hero image'
```

Hero images go in `src/assets/images/`. Body is plain Markdown (fenced code blocks get Solarized dual-theme highlighting automatically). Headings inside posts start at `##` — the post title is the page's only `<h1>`.

## Design system

Solarized light/dark with a toggle. Semantic tokens in `src/styles/global.css` (`--color-heading`, `--color-accent`, `--color-link`, ...) — change tokens, not per-element colors. Headings are WCAG "large text": the contrast bar is 3:1, not 4.5:1. Magenta is reserved for the site brand mark only.

## Writing voice (for any skill/agent reviewing prose)

Waleed writes raw, reflective, experience-first prose — "here is what happened to me and what I learned", never "here are the 7 best practices". Specifics: conversational tone with rhetorical questions; self-deprecating honesty about struggles; short paragraphs; Fix grammar errors; flag judgment calls; NEVER smooth the voice into generic tech-blog polish. When in doubt, keep it raw and ask the author.
