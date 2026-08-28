# Portfolio Site

Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com).

## Structure

- `src/pages/` — Home, Projects list, project detail (`[slug].astro`), About, Contact
- `src/content/projects/` — one Markdown file per project (frontmatter drives the
  project cards and detail pages). Add a new project by creating a new `.md` file
  here — no code changes needed.
- `src/components/` — `Nav`, `Footer`, `ProjectCard`
- `src/layouts/BaseLayout.astro` — shared page shell

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:4321

## Adding a new project

Create a new file in `src/content/projects/`, e.g. `my-project.md`:

```md
---
title: "My Project"
description: "One or two sentence summary."
techStack: ["Python", "Flask"]
githubUrl: "https://github.com/you/my-project"
liveUrl: "https://my-project.example.com"
date: 2026-02-01
featured: false
---

## Overview

Write about the project here in Markdown.
```

Set `featured: true` to have it show up on the home page.

## Deploying

Push this repo to GitHub, then connect it to [Vercel](https://vercel.com) or
[Netlify](https://netlify.com) — both auto-detect Astro and deploy on every push
to `main`.

## To do

- [ ] Replace "Your Name" in `Nav.astro` / `Footer.astro` / `index.astro`
- [ ] Fill in the About page with real bio content
- [ ] Add real contact email in `contact.astro`
- [ ] Add 1–2 more featured projects
- [ ] Add a thumbnail image per project (optional — extend the content schema)
