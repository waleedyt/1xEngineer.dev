---
name: publish
description: Pre-flight checks and full ship pipeline for a post or site change — build, PR, Vercel checks, squash-merge, production verification. Use when Waleed says publish, ship, or deploy.
---

# Publish

Input: a post slug, or a description of the change being shipped (`$ARGUMENTS`).

This file is the single source of truth for the ship pipeline (CLAUDE.md's ship policy points here). Follow CLAUDE.md's environment gotchas: Node 24 active, commits authored as ch.aw.yt@gmail.com. Never push directly to main.

## Pre-flight (must all pass before creating a PR)

1. `npx astro check` — zero errors/warnings.
2. `npx astro build` — succeeds.
3. If shipping a post, verify in `dist/posts/<slug>/index.html`:
   - exactly one `<h1>`; description meta present; no literal `TODO` anywhere
   - `og:image` is an absolute URL pointing at an asset that exists in dist
   - JSON-LD block parses and its `datePublished` matches frontmatter
   - the post appears in `dist/rss.xml` and the sitemap
4. Show the author the rendered title + description pair (it's the social/search card) for a final glance.

## Ship

1. Branch `post/<slug>` (or a descriptive name), commit, push, `gh pr create`.
2. Wait ~15s, then `gh pr checks <branch> --watch` — Vercel preview must pass. On failure: fetch logs (`npx vercel inspect <dpl> --logs`), fix, repeat.
3. `gh pr merge <n> --squash --delete-branch`, then `git pull origin main`.
4. Poll `gh api repos/waleedyt/1xEngineer.dev/commits/$(git rev-parse HEAD)/status` (20s intervals) until `success`.

## Verify production (never skip)

- `curl` the live URL: HTTP 200, title/description present, and for posts the giscus script and JSON-LD are in the HTML.
- Confirm the post is in https://www.1xengineer.dev/rss.xml.

Finish with: live URL, what was verified, and a nudge — the post isn't done until it's shared (Twitter/LinkedIn) and, for the first few posts, submitted in Google Search Console.
