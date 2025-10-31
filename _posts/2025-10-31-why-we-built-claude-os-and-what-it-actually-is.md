---
layout: post
title: "Why we built Claude OS (and what it actually is)"
date: 2025-10-31 10:00:00 -0600
categories: [ai, tools, productivity]
tags: [claude, ai, development-tools, rag, sqlite, productivity]
excerpt: "After the hundredth time explaining the same architecture to Claude, I finally admitted the obvious: we needed AI with actual memory. Here's what we built and why it matters."
author: Bob Roberts
image: /assets/images/covers/claude-os.svg
image_alt: Claude OS - AI that actually remembers
image_position: center center
linkedin_blurb: |
  I spent six months watching Claude Code forget everything between sessions. Every conversation started from zero. Every explanation repeated.

  "Remind me about our auth system again?"

  So we built Claude OS—basically an operating system for AI memory. Now Claude remembers everything across sessions, learns from every conversation, and understands our codebase like a senior dev who's been here for years.

  The secret? SQLite + tree-sitter for blazing fast indexing (10,000 files in 3 seconds), semantic search for understanding context, and persistent memory that never forgets.

  It's 100% local, 100% free, and honestly changed how I code with AI. Full post on the blog.
---

After six months of using Claude Code daily, I finally hit my breaking point. Not because Claude wasn't smart—it absolutely is. But because every single conversation started from zero. Every explanation about our architecture, repeated. Every context about why we do things a certain way, lost the moment I closed the terminal.

I'd spend ten minutes explaining our custom JWT setup. Claude would generate perfect code. Next day, same question, same explanation, same ten minutes gone. Like working with a brilliant dev who can't remember yesterday.

So we built Claude OS. This is the story of why and what it actually is.

## The problem that wouldn't go away

The thing that really got me was how *close* we were to something better. Claude Code is brilliant at understanding codebases, writing clean code, debugging tricky issues. But the moment you close that conversation, everything vanishes. Context, decisions, patterns—all gone.

I tried workarounds. Copying context into every conversation. Maintaining a `CLAUDE.md` file with important details. Writing detailed prompts. None of it solved the real problem: AI assistants start fresh every time, and you pay the tax of re-explaining everything over and over.

The productivity hit was real. I'd estimate I was spending 30–40% of my time with Claude just rebuilding context instead of actually solving problems. That's a tax I'm not willing to pay.

## What we actually built

Claude OS is an operating system for AI memory. That sounds fancy, but it's actually pretty straightforward: we give Claude persistent memory across sessions, automatic learning from conversations, and deep understanding of your codebase.

The architecture has six core pieces:

**1. Real-Time Learning** - Redis pub/sub monitors your conversations and automatically extracts insights. Less than 1ms latency, detects 10+ different pattern types (architectural decisions, bug fixes, edge cases, team preferences, etc.). Completely automatic.

**2. Memory MCP** - Persistent memory you can save and recall. Just say "Remember this:" and Claude OS stores it forever. Next conversation, Claude already knows it.

**3. Semantic Knowledge Base** - Vector embeddings of your entire codebase. Claude doesn't just read your code—it understands relationships, patterns, and context.

**4. Code Structure MCP** - This is the new hotness. Tree-sitter based AST parsing that indexes 10,000 files in 3 seconds. No embedding needed, just pure structural analysis. Knows every function, every import, every dependency.

**5. Analyze-Project** - Hybrid indexing that combines structural and semantic understanding. Git hooks keep everything up to date automatically.

**6. Session Management** - Auto-resume from where you left off. Zero cold starts, context always preserved.

All of this runs locally on SQLite + sqlite-vec. No cloud dependencies, no data leaving your machine, completely private.

## The indexing breakthrough

The thing I'm most excited about is the hybrid indexing system. We were inspired by [Aider's approach](https://github.com/Aider-AI/aider) to tree-sitter indexing, and it completely changed the game.

Before, indexing a large codebase meant embedding every file. On our 10,000-file Rails app (Pistn), that took 3–5 hours. You literally couldn't start coding until the indexing finished. It was brutal.

Now? Three seconds for structural indexing. Three. Seconds.

The trick is splitting indexing into two phases:

**Phase 1 (structural):** Parse files with tree-sitter, extract symbols (classes, functions, signatures), build dependency graph, calculate PageRank importance. No LLM calls, just AST traversal. Instant.

**Phase 2 (semantic):** Selectively embed the top 20% most important files (based on PageRank) plus all documentation. This runs in the background while you code. Optional, doesn't block anything.

We went from 100,000+ embedded chunks to ~20,000 (80% reduction) while getting *better* results because we have both structural and semantic understanding.

## How it actually works in practice

Here's what a typical session looks like now:

I open Claude Code in a project I initialized with Claude OS. Claude automatically loads recent memories, checks for an active session, and asks if I want to continue where I left off.

I say "yes, let's keep working on that payment refund bug."

Claude already knows:
- Our payment processor changed their transaction ID format last week
- The migration script I wrote is in `/services/payment_processor.js` line 234
- Tests are in `__tests__/payment_processor.test.js` lines 156–189
- I still need to test the edge case for subscriptions that refund across month boundaries

No re-explaining. No "what were we working on?" No lost context. Just pick up and go.

When I discover something new—like "oh, refunds for subscriptions fail because of timezone handling in the token service"—I say "Remember this for the payment refund context." Claude OS saves it. Forever.

Next time anyone on the team asks about payment refunds, that knowledge is already there.

## The installation reality check

I'll be honest about this part: getting Claude OS set up is not a one-click operation. You need Ollama for local AI, Redis for the real-time learning system, and Python 3.11+ for the MCP server.

But once it's installed, it's installed for *all* your projects. Run `./install.sh` once, then `/claude-os-init` in any project, and you're done. Two minutes to initialize a project, then permanent memory from that point forward.

We built a whole template system so teams can share Claude OS. One person sets it up, everyone else runs `./install.sh` and gets the same commands, same skills, same setup. It's worked really well for us.

## What surprised me most

The thing I didn't expect was how much the automatic learning system would matter. I thought I'd mostly use explicit "Remember this" commands. But the real-time learning catches so much stuff I would've forgotten to save.

It detected that we always use composition over inheritance in our service objects. It learned our naming convention for event handlers. It noticed we have timezone issues in the scheduler and now warns about them proactively.

It's like having institutional knowledge that actually sticks around instead of walking out the door when someone leaves the team.

## The stuff that's still hard

Claude OS doesn't solve everything. The initial setup takes time. You need to run services (Ollama, Redis, the MCP server). If you're on a low-RAM machine, running local AI might not be practical.

Also, this is version 1.0. There are rough edges. The UI is functional but basic. We're finding bugs. The indexing has quirks. It gets the job done, just don't expect polish.

And honestly, explaining what Claude OS *is* to people who haven't felt the pain of starting every AI conversation from scratch is hard. If you haven't spent hours re-explaining the same architecture to Claude, the value prop isn't obvious.

## What we'd do differently next time

If I could rewind six months, I'd start with the hybrid indexing from day one. We wasted a ton of time on full embeddings before discovering the tree-sitter approach. The 600–1000x speedup changed everything.

I'd also set up better templates from the start. We only added the team-sharing features after three coworkers asked how to install it. Should've seen that coming.

And I'd spend more time on docs early. We built the thing for ourselves, then realized other people might want it, then scrambled to write guides. Not ideal.

## Why it matters

Here's why I think Claude OS matters beyond just solving my personal annoyance:

AI assistants are getting really good at understanding code and generating solutions. But they're still fundamentally limited by starting fresh every time. It's like hiring a brilliant consultant who forgets everything between meetings.

The real productivity unlock isn't smarter AI—it's AI with memory. AI that learns your patterns, understands your architecture, remembers your decisions. That's when you stop being an explainer and start being a builder.

We're seeing this play out on our team. New developers run `/claude-os-init` on a project and Claude immediately knows the coding standards, the architecture patterns, the gotchas to avoid. Onboarding went from weeks to days because the knowledge is just *there*.

## What's next

Adding more languages to the tree-sitter indexing. Right now it's Ruby, Python, JavaScript, TypeScript, Go, Rust, Java, C++. Goal is to support pretty much everything.

Better UI for browsing memories and managing knowledge bases. Right now it works but it's pretty bare bones.

And we're thinking about optional cloud sync for teams. Keep everything local by default, but let teams share knowledge bases if they want to. Still figuring out the details.

## Should you try it?

If you're using Claude Code (or any AI assistant) regularly and you're tired of re-explaining the same stuff every conversation, yeah, probably worth a look.

If you work on a team and institutional knowledge keeps walking out the door, definitely worth trying.

If you have a big codebase and waiting 3–5 hours for indexing sounds painful, the hybrid indexing alone might be worth it.

Check it out at [github.com/brobertsaz/claude-os](https://github.com/brobertsaz/claude-os). There's also a [live demo](https://thebob.dev/claude-os/) if you want to see what it looks like before installing.

It's 100% free, 100% open source, MIT licensed. Built by developers who got tired of starting every conversation from zero.

---

## The one-minute version

- **Problem:** AI assistants forget everything between sessions
- **Solution:** Give them persistent memory and codebase understanding
- **How:** SQLite for storage, tree-sitter for structure, vector embeddings for semantics
- **Speed:** 10,000 files indexed in 3 seconds (was 3–5 hours)
- **Cost:** Free, runs locally, never sends your code anywhere
- **Install:** `./install.sh` once, `/claude-os-init` per project

If you try it, let me know what breaks. I want to know which features people actually use versus the ones we thought were important.

Got ideas for better AI dev tools? Hit me up. This whole space is figuring itself out and there's tons of room for improvement.
