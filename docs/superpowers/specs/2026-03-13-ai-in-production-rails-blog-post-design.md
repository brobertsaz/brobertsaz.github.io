# Blog Post Design: What a Year of AI in Production Rails Taught Me

## Overview

A narrative blog post for experienced Rails developers telling the story of integrating AI into a production Rails app (Pistn), building Claude-OS to solve the memory problem, and then watching the platform catch up. The through-line is: the tooling moves fast, but the engineering fundamentals are what keep you standing.

## Target Audience

Experienced Rails developers who are curious about AI integration but haven't taken the plunge yet, or are early in the process.

## Voice & Tone

- First-person, conversational, like talking to another dev over coffee
- Opinionated but not preachy
- Draws from real experience, not hypotheticals
- No em dashes (AI giveaway)
- Regular dashes, casual punctuation, short paragraphs
- Matches existing posts on brobertsaz.github.io

## Post Structure

### Section 1: The Hook
Open with the punchline: built an open-source project, 100+ GitHub stars, active community, and now don't use it anymore. Frame this as a feature of how fast AI tooling moves, not a failure. Set up the journey.

### Section 2: Where It Started - Needing AI in a Real App
- Introduce Pistn: automotive service management SaaS, running since 2014, 10,000+ file Rails codebase
- The first AI need: documentation assistant so the team could ask questions about the platform architecture
- Built with OpenAI API using HTTParty, gpt-3.5-turbo, custom search across 690+ knowledge docs
- Multi-strategy search: exact phrase, keyword, semantic, code matching
- Question type detection, user role inference, conversation history

### Section 3: The Patterns That Saved Us
Production-hardened patterns from that first integration:
- Circuit breaker (3 failures = open circuit, 5 min recovery, 2 successes to close)
- Caching high-confidence responses for 24 hours
- Graceful degradation: keyword search and fuzzy matching when OpenAI goes down
- Rate limiting
- Timeouts with exponential backoff retry
- Key point: these patterns matter regardless of which LLM you use

### Section 4: The Memory Problem
- Using Claude Code daily on Pistn
- 30-40% of time spent re-explaining architecture every session
- CLAUDE.md helped but wasn't enough
- The frustration of a brilliant dev who forgets everything overnight
- Tried workarounds: copying context, detailed prompts, documentation files

### Section 5: So We Built Claude-OS
- Brief recap (link to original posts, don't rehash everything)
- Persistent memory across sessions
- Tree-sitter indexing: 10,000 files in 3 seconds vs 3-5 hours for full embeddings
- Skills library: teachable behaviors (debugging frameworks, TDD, verification)
- Session insights: auto-extracting patterns from work sessions
- Community grew: 100+ stars, 25 forks, 7 contributors, active Discord
- It genuinely solved the problem

### Section 6: Then Claude Caught Up
- Claude shipped native memory, projects, improved CLAUDE.md support
- The problems Claude-OS solved started getting solved by the platform
- Gradual transition, not a single moment
- We stopped needing it
- This is OK. This is how it should work.

### Section 7: What I'd Tell You Now
Durable lessons for experienced Rails devs:
- Build resilience patterns from day one (circuit breakers, fallbacks, caching)
- Don't get attached to your abstractions, the platform will move under you
- Start with a real problem, not "let's add AI to this"
- The boring engineering (error handling, timeouts, graceful degradation) matters more than the AI part
- Test your fallbacks as hard as you test your happy path
- Keep your LLM integration behind a clean interface so you can swap providers

### Section 8: The Path Forward
- AI tooling is converging fast
- The gap between "build it yourself" and "use the platform" is closing
- The developers who do well understand the fundamentals underneath
- Don't wait for the tools to be perfect. Build, learn, adapt.

### Closing
Short, punchy. Build things. Learn from them. Be ready to let them go when something better comes along. That's the job.

## Frontmatter

```yaml
layout: post
title: "What a Year of AI in Production Rails Taught Me (Including Building Something I No Longer Need)"
date: 2026-03-13 10:00:00 -0700
categories: [ai, rails, development]
tags: [ai, rails, openai, claude, production, development-tools]
author: Bob Roberts
image: /assets/images/covers/ai-rails-journey.png
image_alt: What a Year of AI in Production Rails Taught Me
image_position: center center
excerpt: "I built an open-source project, got 100+ GitHub stars, grew a community around it, and now I don't use it anymore. Here's what a year of AI in production Rails actually taught me."
linkedin_blurb: |
  I built an open-source project for AI memory. Got 100+ GitHub stars. Built a community. Active Discord.

  And now I don't use it anymore.

  Not because it failed. Because Claude caught up. The platform shipped native memory, better context handling, and most of what we built by hand.

  But here's the thing: a year of building AI into a production Rails app taught me lessons that don't expire when the tools change.

  Circuit breakers. Graceful degradation. Clean interfaces you can swap. Testing your fallbacks as hard as your happy path.

  The boring engineering stuff is what actually keeps you running when the AI vendor has an outage at 2 AM.

  Full post on the blog.
```

## Cover Image

Generate a cover image (PNG, 1200x630 or similar) with:
- Dark theme matching the blog (background #0d1117)
- Accent color #64ffda
- Visual concept: a timeline or journey visualization showing evolution (OpenAI integration > Claude-OS > Native Claude), suggesting progression and adaptation
- Clean, minimal, developer-oriented aesthetic
- No text overlay needed (title renders separately on the blog)

## Deliverables

1. Blog post markdown file at `_posts/2026-03-13-what-a-year-of-ai-in-production-rails-taught-me.md`
2. Cover image at `assets/images/covers/ai-rails-journey.png`
3. LinkedIn blurb included in frontmatter
