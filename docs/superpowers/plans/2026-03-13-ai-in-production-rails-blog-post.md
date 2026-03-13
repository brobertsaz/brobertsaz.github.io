# AI in Production Rails Blog Post - Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write and publish a blog post about integrating AI into a production Rails app, the Claude-OS journey, and lessons learned.

**Architecture:** Blog post markdown file + SVG cover image + LinkedIn blurb in frontmatter. Follows existing post format and conventions on brobertsaz.github.io.

**Tech Stack:** Jekyll, Markdown, SVG

---

## Chunk 1: Write the Blog Post

### Task 1: Write the blog post markdown file

**Files:**
- Create: `_posts/2026-03-13-what-a-year-of-ai-in-production-rails-taught-me.md`

**Reference:**
- Spec: `docs/superpowers/specs/2026-03-13-ai-in-production-rails-blog-post-design.md`
- Voice reference: `_posts/2026-02-28-vibe-coding-vs-ai-assisted-coding.md`
- Claude-OS posts: `_posts/2025-10-31-why-we-built-claude-os-and-what-it-actually-is.md`, `_posts/2025-12-11-whats-new-in-claude-os-v2-3.md`
- Pistn AI code: `~/Projects/pistn/app/services/open_ai_documentation_service.rb`, `~/Projects/pistn/app/services/open_ai_circuit_breaker.rb`

**Writing rules:**
- No em dashes (double dashes). Use regular dashes, commas, or restructure sentences.
- First person, conversational, opinionated
- Short paragraphs, casual punctuation
- Draw from real Pistn experience and Claude-OS posts
- 200+ GitHub stars (user corrected from 100+)
- Link to the two Claude-OS blog posts where referenced

- [ ] **Step 1: Write the complete blog post**

Write the full markdown file with frontmatter and all 8 sections plus closing, following the spec structure exactly. Match Bob's writing voice from existing posts.

- [ ] **Step 2: Review for em dashes and AI tells**

Scan the post for any em dashes (--), overuse of "delve", "tapestry", "landscape", "robust", or other AI writing patterns. Fix any found.

- [ ] **Step 3: Commit**

```bash
git add _posts/2026-03-13-what-a-year-of-ai-in-production-rails-taught-me.md
git commit -m "Add blog post: What a Year of AI in Production Rails Taught Me"
```

### Task 2: Create the cover image

**Files:**
- Create: `assets/images/covers/ai-rails-journey.svg`
- Update frontmatter in post to reference `.svg` instead of `.png`

**Design:**
- Dark theme: background #0d1117
- Accent color: #64ffda
- Timeline/journey visualization: three nodes showing evolution (OpenAI > Claude-OS > Native Claude)
- Clean, minimal, developer aesthetic
- Match style of existing cover images in the repo

- [ ] **Step 1: Check existing cover image styles**

Look at existing SVG covers in `assets/images/covers/` for style reference.

- [ ] **Step 2: Create the SVG cover image**

Create an SVG with the timeline visualization concept.

- [ ] **Step 3: Update post frontmatter image path**

Change `image: /assets/images/covers/ai-rails-journey.png` to `.svg` if using SVG format.

- [ ] **Step 4: Commit**

```bash
git add assets/images/covers/ai-rails-journey.svg _posts/2026-03-13-what-a-year-of-ai-in-production-rails-taught-me.md
git commit -m "Add cover image for AI in production Rails post"
```

### Task 3: Push and verify

- [ ] **Step 1: Push to remote**

```bash
git push
```

- [ ] **Step 2: Verify GitHub Pages build starts**

Check that the push triggers a build.
