---
layout: post
title: "What a Year of AI in Production Rails Taught Me (Including Building Something I No Longer Need)"
date: 2026-03-13 10:00:00 -0700
categories: [ai, rails, development]
tags: [ai, rails, openai, claude, production, development-tools]
author: Bob Roberts
image: /assets/images/covers/ai-rails-journey.svg
image_alt: What a Year of AI in Production Rails Taught Me
image_position: center center
excerpt: "I built an open-source project, got 200+ GitHub stars, grew a community around it, and now I don't use it anymore. Here's what a year of AI in production Rails actually taught me."
linkedin_blurb: |
  I built an open-source project for AI memory. Got 200+ GitHub stars. Built a community. Active Discord.

  And now I don't use it anymore.

  Not because it failed. Because Claude caught up. The platform shipped native memory, better context handling, and most of what we built by hand.

  But here's the thing: a year of building AI into a production Rails app taught me lessons that don't expire when the tools change.

  Circuit breakers. Graceful degradation. Clean interfaces you can swap. Testing your fallbacks as hard as your happy path.

  The boring engineering stuff is what actually keeps you running when the AI vendor has an outage at 2 AM.

  Full post on the blog.
---

I built an open-source project. It got over 200 stars on GitHub. We had an active Discord, contributors submitting pull requests, people using it on real projects. And now? I don't use it anymore.

That's not a failure story. That's what building with AI actually looks like right now. The tools move so fast that something you built six months ago can become unnecessary, not because it was bad, but because the platform caught up. If you're a Rails developer thinking about integrating AI into your app, that's probably the most important thing I can tell you up front.

But I'm getting ahead of myself. Let me start from the beginning.

## Where it started - needing AI in a real app

I run an automotive service management SaaS that's been around since 2014. We're talking tire shops, oil change centers, service centers. The Rails codebase has grown to over 10,000 files. It does a lot: custom branded websites for each dealer, CRM with email campaigns and text messaging, online appointment booking, POS integration, analytics. The usual SaaS sprawl that happens when you've been building something for a decade.

The first time we actually needed AI was for a documentation assistant. Our platform has a lot of moving parts, and our team needed a way to ask questions about how things work without digging through hundreds of files. Think of it as an internal search engine that actually understands what you're asking, not just matching keywords.

We built it with OpenAI's API. Nothing fancy for the initial integration - HTTParty calls to gpt-3.5-turbo, custom search across 690+ knowledge docs we'd written about the platform. We added multi-strategy search so it would try exact phrase matching first, then keyword search, then semantic search, then code-specific matching. It detected what type of question you were asking (troubleshooting, how-to, configuration, etc.) and adjusted its responses accordingly.

It worked. People actually used it. And that's when the real lessons started.

## The patterns that saved us

Here's the thing about calling an external AI API from a production Rails app: it will go down. Not if, when. And when it does, you need your app to keep working.

The first pattern we implemented was a circuit breaker. Three failures in a row and the circuit opens, meaning we stop trying to call OpenAI entirely for five minutes. After the recovery period, we let one request through. If it works, we need two successful requests before we consider the circuit closed again. This sounds over-engineered until the first time OpenAI has a bad hour and your app just keeps chugging along instead of backing up requests and timing out everywhere.

We cached high-confidence responses for 24 hours. If the AI gave an answer with a confidence score above 0.7, we'd store it and serve it directly next time someone asked the same thing. This cut our API calls dramatically and made responses faster for common questions.

Graceful degradation was probably the most important one. When OpenAI was down or the circuit breaker was open, we fell back to keyword search with fuzzy matching using Levenshtein distance. Not as smart as the AI-powered search, but still useful. The user got an answer, maybe not the best answer, but they didn't get an error page.

Rate limiting, timeouts with exponential backoff, retry logic. All the boring stuff. All the stuff that actually matters.

Here's what I want to emphasize to other Rails devs: these patterns have nothing to do with AI specifically. They're the same patterns you'd use for any unreliable external service. Stripe goes down, Twilio has issues, SendGrid has a bad day. The AI part is almost irrelevant. What matters is that you're calling someone else's servers, and you need a plan for when they don't answer.

## The memory problem

Around the same time we were building the documentation assistant, I started using Claude Code daily for development work on the platform. And Claude Code is genuinely great. It understands code, writes clean solutions, debugs tricky issues. But it had one massive problem: every conversation started from scratch.

I'd spend ten minutes explaining our account hierarchy. Account has GroupAccount, GroupAccount has DealerAccount, there are integrated sites with shared variant partials, the Front::LocalController handles specific routes separately from FrontController. Claude would get it, write perfect code, and then tomorrow? Same conversation, same ten minutes, same explanation.

I estimated I was spending 30-40% of my time with Claude just rebuilding context instead of actually solving problems. That's a brutal tax on productivity.

I tried the workarounds. Keeping a detailed CLAUDE.md file. Copying context into every conversation. Writing really specific prompts. It all helped a little, but none of it solved the fundamental issue: the AI couldn't remember anything between sessions.

## So we built Claude-OS

If you've read my previous posts, you know this part. We built [Claude-OS](https://github.com/brobertsaz/claude-os), basically an operating system for AI memory. I wrote about [why we built it](/ai/tools/productivity/2025/10/31/why-we-built-claude-os-and-what-it-actually-is/) and [what's new in v2.3](/ai/tools/productivity/2025/12/11/whats-new-in-claude-os-v2-3/) if you want the full story.

The short version: we gave Claude persistent memory across sessions, automatic learning from conversations, and deep understanding of our codebase. Tree-sitter based indexing that could process 10,000 files in 3 seconds instead of 3-5 hours for full embeddings. A skills library with 36+ teachable behaviors. Session insights that automatically extracted patterns from your work.

The community grew. Over 200 stars on GitHub, 25 forks, 7 contributors, an active Discord. People were using it on their own projects and finding real value.

And it genuinely solved the problem. Sessions started with context already loaded. Claude knew what we'd been working on, what patterns we'd established, what gotchas to avoid. The 30-40% context tax mostly went away.

## Then Claude caught up

This is the part of the story I didn't see coming, even though I probably should have.

Claude started shipping features that addressed exactly the problems we'd built Claude-OS to solve. Native memory that persists across conversations. Better project awareness. Improved CLAUDE.md support. Longer context windows that made it feasible to load more information up front.

It wasn't one big moment. It was gradual. I'd notice that Claude remembered something from a previous session without Claude-OS running. I'd see it pick up on project patterns without us explicitly teaching them. The gap between what Claude could do natively and what Claude-OS added kept shrinking.

Eventually, we stopped needing it.

And you know what? That's fine. That's actually how it should work. We identified a real problem, built a real solution, learned a ton doing it, and then the platform evolved to handle it. If you're building developer tools, this should be an outcome you're prepared for. The platforms we build on are not standing still.

## What I'd tell you now

If you're a Rails developer thinking about AI integration, here's what actually matters based on a year of doing it:

**Build resilience patterns from day one.** Don't add the circuit breaker later. Don't add caching after you get the first outage. Treat the AI API like what it is: an external service that will go down, will be slow sometimes, and will occasionally return garbage. Plan for all three.

**Don't get attached to your abstractions.** We built a whole project around AI memory and context management. Now we don't need it. If we'd built our app's core features on top of Claude-OS, we'd be doing a migration right now. Keep your AI integration behind clean interfaces. Make it swappable. Because you will probably swap it.

**Start with a real problem.** We didn't add AI to our platform because AI is cool. We added it because our team needed a better way to find information in a complex system. The documentation assistant solved a real pain point. If you're adding AI because you feel like you should, stop and find the actual problem first.

**The boring engineering matters more than the AI part.** Error handling, timeouts, graceful degradation, caching, rate limiting. Nobody writes blog posts about implementing exponential backoff. But that's the stuff that keeps your app running when things go sideways. The AI part is honestly the easy part. Making it reliable in production is where the real work lives.

**Test your fallbacks as hard as you test your happy path.** When we first launched the documentation assistant, our fallback keyword search had a bug that returned empty results for half the queries. We didn't catch it because we'd only tested the OpenAI-powered path. Your fallback is useless if it doesn't work when you need it.

**Keep your LLM integration behind a clean interface.** We started with gpt-3.5-turbo. We could have moved to gpt-4, Claude, or anything else without touching the rest of our application code. That abstraction cost us almost nothing to build but would have saved us a painful migration if we'd needed to switch in a hurry.

## The path forward

AI tooling for developers is converging fast. The gap between "build it yourself" and "just use what the platform gives you" gets smaller every month. Features that required custom infrastructure a year ago are becoming standard.

That doesn't mean you shouldn't build. We learned more from building Claude-OS and our documentation assistant than we would have learned from any tutorial or course. The experience of putting AI into production, hitting the edge cases, building the resilience patterns, understanding how these models actually behave when real users interact with them - that knowledge doesn't expire even when the specific tools do.

The developers who are going to do well with AI aren't the ones waiting for everything to be perfect. They're the ones building now, learning from what breaks, and staying flexible enough to adapt when the ground shifts under them. Which it will. Repeatedly.

Build things. Learn from them. Be ready to let them go when something better comes along. That's always been the job.
