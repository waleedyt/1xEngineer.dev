---
name: edit-post
description: Voice-preserving editing pass over a draft post — grammar, mechanics, frontmatter, and structure without smoothing the author's raw style. Use when a draft is ready for review or Waleed asks to check/edit/polish a post.
---

# Edit post

Input: a post slug or path (`$ARGUMENTS`). If ambiguous, list files in `src/content/posts/` and ask.

Read the CLAUDE.md voice guide first. The prime directive: **fix errors, flag judgment calls, never rewrite the voice.** The author likes the raw sound; generic tech-blog polish is a regression.

## Pass 1 — Language

- Fix outright grammar errors (missing articles, agreement, tense) and typos. Apply these directly.
- Judgment calls (idiom choices, punchy fragments, unusual phrasing that might be intentional): do NOT change — list them with a recommendation and let the author decide.
- Preserve emojis, rhetorical questions, self-deprecation, and conversational headings.

## Pass 2 — Mechanics (apply directly)

- Frontmatter validates against the schema (CLAUDE.md content model); date is quoted `'YYYY-MM-DD'`.
- `description`: present, hook-quality, ≤160 chars (it's the search snippet and homepage teaser). Draft one from the post if it's TODO — in the author's voice — and flag for approval.
- `imageAlt` accurately describes the actual hero image (Read the image file to check).
- Headings: body starts at `##`, hierarchy never skips a level, each section carries one idea.
- No raw `<Image>` in the body (the layout renders the hero); fenced code blocks have a language tag.
- Links resolve (spot-check external ones with curl).

## Pass 3 — Reader flow (report only)

Read it start to finish as a reader: where does it drag, where does the payoff land, does the opening earn the click the description promised? Report observations; don't restructure without being asked.

Finish with: changes applied, judgment calls awaiting a decision, and (optionally) a suggestion to run the `reader-critic` agent for audience feedback before publishing.
