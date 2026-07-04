---
name: site-health
description: Periodic maintenance sweep — build health, dependency audit, link rot, production smoke test. Use when Waleed asks for a checkup, or when returning to the repo after weeks away.
---

# Site health

A maintenance checklist, not a refactoring license: report findings, apply only safe fixes, and ship anything code-changing through the CLAUDE.md ship flow.

## Checks

1. **Build health**: `npx astro check && npx astro build` on a fresh `npm ci`. Both must pass.
2. **Dependencies**: `npm outdated` and `npm audit`. Classify: security-relevant for a *static site* (very little is — dev-server-only advisories don't matter in production) vs. routine drift. Patch/minor bumps of Astro/Tailwind may be applied and shipped if the build stays green; NEVER do a major-version migration inside this skill — propose it separately with a plan.
3. **Production smoke test**: curl every route (`/`, `/about/`, each `/posts/<slug>/`, `/rss.xml`, `/sitemap-index.xml`, `/robots.txt`) — expect 200s; a bogus path — expect 404. Verify security headers are still served.
4. **Link rot**: extract external links from all posts, curl each, report dead ones (don't auto-edit prose).
5. **Third-party pulse**: giscus script loads on a post page; GoatCounter beacon present.
6. **Content pulse** (the real health metric): date of the newest post. If it's been more than a month, say so plainly — this blog's biggest historical risk is silence, not software.

## Output

A short report: green/yellow/red per area, fixes applied (with PR links), and at most three recommended follow-ups ordered by effort-to-value.
