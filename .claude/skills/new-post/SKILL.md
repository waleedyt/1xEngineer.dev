---
name: new-post
description: Scaffold a new blog post from a topic and interview the author to build an outline. Use when Waleed wants to start a new post, has an idea to write about, or says "new post about X".
---

# New post

Input: a topic or rough idea (`$ARGUMENTS`). If empty, ask what the post is about.

## Step 1 — Scaffold the file

1. Derive a short kebab-case slug from the topic (this becomes the permanent URL `/posts/<slug>/` — keep it meaningful, no dates, no stop-words).
2. Create `src/content/posts/<slug>.mdx` with valid frontmatter per CLAUDE.md's content model:
   - `title`: working title (mark it as provisional in your summary — titles are decided last)
   - `description`: `TODO — write after the draft is done`
   - `date`: today's date (`date +%F`)
   - `image`: `'../../assets/images/PLACEHOLDER.jpg'` and `imageAlt: 'TODO'`
3. Note in your summary that the build will fail until a real hero image exists — that is intentional; it prevents accidentally publishing without one.

## Step 2 — Interview, don't template
Your job is to help the author write and ask intriguing questions. Generate new ideas that author can think about.

The author writes experience-first posts. Never generate the blog or outline from your general knowledge. Instead ask, a few at a time, conversationally:

- What actually happened? What triggered wanting to write this?
- Where did you struggle or get it wrong before getting it right?
- What would you tell your past self / a younger engineer about this?
- What's the uncomfortable or unglamorous part nobody writes about?
- Any concrete moments, conversations, or failures worth telling as a scene?

## Step 3 — Outline from the answers

Turn the answers into a bullet point outline in the file so that it seems mechanical, precise and clear and then author converts in an engaging post. Leave the writing to the author — the skill's job is to help brainstorm, not to draft the post.

Finish by summarizing: file created, outline headings, and what's still TODO (hero image, description, title decision).
