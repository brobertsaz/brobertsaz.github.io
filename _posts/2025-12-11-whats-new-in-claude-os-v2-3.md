---
layout: post
title: "What's New in Claude OS v2.3: Skills Library, Session Insights, and 100+ Stars"
date: 2025-12-11 10:00:00 -0600
categories: [ai, tools, productivity]
tags: [claude, ai, development-tools, rag, sqlite, productivity, skills]
excerpt: "Two months ago we launched Claude OS. Now we're at 100+ stars with a skills library, session insights, and a real community. Here's what's new."
author: Bob Roberts
image: /assets/images/covers/claude-os.svg
image_alt: Claude OS v2.3 - Skills Library and Session Insights
image_position: center center
linkedin_blurb: |
  Two months ago I wrote about building Claude OS - the memory system that stops you from re-explaining your codebase to Claude every session.

  Since then: 100+ GitHub stars, 25 forks, 7 contributors, and some features that actually changed how I code.

  The big one? Skills Library. 36+ teachable behaviors you can install with one click. TDD workflows. Debugging frameworks. PDF manipulation. Claude follows them automatically.

  Also: Session insights that extract patterns from your work. A beautiful new installer. And a wiki with our "staff picks" of skills we actually trust.

  If you've ever wished Claude would remember what it learned yesterday, this might be worth a look. Full post on the blog.
---

Two months ago, I wrote about [why we built Claude OS](https://thebob.dev/ai/tools/productivity/2025/10/31/why-we-built-claude-os-and-what-it-actually-is/) and the problem it solves: spending 30–40% of your time re-explaining your codebase to Claude because it forgets everything between sessions.

Since then, Claude OS has grown from a personal productivity tool into something with a real community behind it. We crossed **100 stars** on GitHub, have **25 forks**, **7 contributors**, and an active Discord. But more importantly, we shipped features that make Claude genuinely better at its job.

Here's what's new in v2.3.

## The Skills Library: Teaching Claude new tricks

The biggest addition in v2.3 is the **Skills Library**—a way to browse, install, and manage reusable instruction sets that teach Claude specific capabilities.

### What are skills?

Skills are markdown files that live in `.claude/skills/` and automatically load when relevant. They can teach Claude anything: coding patterns, debugging frameworks, tool workflows, domain-specific knowledge.

For example, the `systematic-debugging` skill teaches Claude a five-phase debugging framework instead of letting it guess-and-check:

```
Phase 0: Problem Intake (ASK questions first)
Phase 1: Root Cause Investigation
Phase 2: Pattern Analysis
Phase 3: Hypothesis Testing
Phase 4: Implementation with TDD
```

Before this skill, Claude would often jump straight to "fixing" bugs without understanding them. Now it asks clarifying questions first. That single behavior change has saved me hours of frustration.

### 36+ community skills

We've integrated two skill repositories:

**Anthropic Official (16 skills):**
- `pdf` - Create, edit, analyze PDF documents
- `xlsx` - Spreadsheet manipulation with formulas
- `frontend-design` - Production-grade UI components
- `mcp-builder` - Create MCP servers
- `doc-coauthoring` - Collaborative documentation workflow

**Superpowers by Jesse Vincent (20 skills):**
- `test-driven-development` - Rigorous TDD: red-green-refactor
- `systematic-debugging` - The five-phase framework mentioned above
- `verification-before-completion` - Prevents Claude from saying "done" without evidence
- `brainstorming` - Structured ideation before coding
- `root-cause-tracing` - Trace bugs backward through call stacks

### Installing is simple

```bash
/claude-os-skills                    # List installed skills
/claude-os-skills install pdf        # Install from community
/claude-os-skills templates          # Browse local templates
```

Or use the web UI at `http://localhost:5173`—browse skills visually, read descriptions, install with one click.

### Our curated recommendations

Not all skills are created equal. We've started a [Recommended Skills wiki page](https://github.com/brobertsaz/claude-os/wiki/Recommended-Skills) with our "staff picks"—skills we actually use daily and trust.

**The "Must-Have Stack":**
1. `systematic-debugging` - Prevents guess-and-check debugging
2. `verification-before-completion` - Prevents false "done" claims
3. `brainstorming` - Structured design before coding

These three address Claude's most common failure modes. Install them first.

## Session Insights: Let Claude remember what it learned

The second major feature is **Session Insights**—the ability to parse Claude Code sessions and extract valuable patterns automatically.

### The problem

Claude Code saves session transcripts as `.jsonl` files. They contain everything: decisions made, bugs fixed, patterns discovered. But they just sit there, unprocessed. Until now.

### How it works

Claude OS can now:
1. **Parse session files** - Read Claude Code's native `.jsonl` format
2. **Extract insights** - Identify decisions, patterns, solutions, and blockers
3. **Save to memory** - Store in your project's knowledge base for future reference

When you end a session, Claude OS can prompt you: "I found 3 insights from this session. Save them to memory?"

### What gets extracted

- **Decisions**: "We chose JWT over sessions because..."
- **Patterns**: "form_for @object vs :symbol—use object when partials need f.object"
- **Solutions**: "Fixed N+1 query by eager loading associations"
- **Blockers**: "Can't upgrade Rails due to gem X incompatibility"

These become searchable context that loads automatically in future sessions. Claude doesn't just remember what you explicitly told it—it remembers what you discovered together.

## Beautiful new installer (v2.2)

The installer got a complete makeover with [Charm CLI (gum)](https://github.com/charmbracelet/gum) support:

```bash
./setup-claude-os.sh --demo    # See the beautiful UI (no changes made)
./setup-claude-os.sh --dry-run # Preview what would happen
```

**New features:**
- Interactive menus with arrow-key navigation
- Graceful bash fallback when gum isn't available
- Safety features: `--demo`, `--dry-run`, automatic config backups
- Lite model default: `llama3.2:3b` (2GB) instead of 8b (4.7GB)
- Cloud option: Choose local Ollama or OpenAI during setup
- Better Linux support across distros

The `--demo` flag is particularly nice for kicking the tires before committing to anything.

## Community contributions

This release wouldn't exist without our contributors:

| Contributor | Contributions |
|-------------|--------------|
| [@illAssad](https://github.com/illAssad) | SQLite cursor fixes, tree-sitter compatibility, non-blocking indexing, Jobs Dashboard |
| [@williamclavier](https://github.com/williamclavier) | Auto-create commands/skills directories |
| [@jplimack](https://github.com/jplimack) | Dynamic paths (no more hardcoding!) |
| [@gkastanis](https://github.com/gkastanis) | Linux support, missing frontend files |
| [@nicseltzer](https://github.com/nicseltzer) | Documentation fixes |

**Thank you.** Every PR makes Claude OS better for everyone.

## What's actually working well

After two months of daily use on real projects, here's what I can report:

**Session context loading** - This is the killer feature. Every session starts by searching recent memories and loading relevant context. Claude doesn't start cold anymore. It knows what we were working on, what patterns we've established, what gotchas to avoid.

**The Kanban board** - When using Agent-OS for spec-driven development, the real-time board is genuinely useful. Edit `tasks.md`, board updates in ~6 seconds. It's not revolutionary, but it's nice to see progress visually.

**Tree-sitter indexing** - 10,000 files in 30 seconds instead of hours. This made Claude OS usable for large codebases. If you haven't read the [original post](https://thebob.dev/ai/tools/productivity/2025/10/31/why-we-built-claude-os-and-what-it-actually-is/), the 600–1000x speedup was a game-changer.

**Skills** - Having Claude follow `systematic-debugging` instead of guess-and-check has saved hours of frustration. The Phase 0 "ask questions first" behavior alone is worth the install.

## What's still rough

I promised transparency in the first post, so here's what needs work:

**Installation complexity** - It's better with the new installer, but still requires Python 3.11/3.12, Ollama or OpenAI, and some terminal comfort. We're not at "npm install" simplicity yet.

**Memory consolidation** - We track that memories should be consolidated, but haven't built the actual consolidation yet. Your knowledge base grows forever without cleanup.

**Windows support** - Not there. Coming, but not there.

**Extraction accuracy** - Session insight extraction uses Ollama's LLM. Quality varies. We recently fixed a hallucination bug where it was inventing insights that weren't in the transcript. It's better now, but not perfect.

## The road to 125 stars

We're at **106 stars** and aiming for **125 by Christmas**. Sounds arbitrary, but having a goal keeps us shipping.

If Claude OS has helped your workflow, consider:

- ⭐ [Starring the repo](https://github.com/brobertsaz/claude-os)
- 📣 Sharing with other Claude Code users
- 🤝 Contributing a skill, fix, or improvement
- 💬 Joining the [Discord](https://discord.gg/BrvVYdXkCU)

Every star helps more developers discover that Claude doesn't have to forget everything between sessions.

## Try it

```bash
git clone https://github.com/brobertsaz/claude-os.git
cd claude-os
./setup-claude-os.sh --demo  # See the UI first
./setup-claude-os.sh         # Install for real
```

**Links:**
- **GitHub**: [brobertsaz/claude-os](https://github.com/brobertsaz/claude-os)
- **Documentation**: [thebob.dev/claude-os](https://thebob.dev/claude-os/)
- **Wiki**: [Recommended Skills](https://github.com/brobertsaz/claude-os/wiki/Recommended-Skills)
- **Discord**: [Join the community](https://discord.gg/BrvVYdXkCU)

---

## The one-minute version

- **What's new:** Skills library (36+ skills), session insights, beautiful installer
- **Skills:** Teachable behaviors—TDD, debugging, PDF manipulation, and more
- **Session insights:** Auto-extract patterns from your work sessions
- **Community:** 100+ stars, 7 contributors, active Discord
- **Still free:** 100% local, never sends your code anywhere

If you try the skills library, let me know which ones actually help. We're building the "recommended" list based on what people actually use, not what sounds impressive.

See you at 125 stars. 🚀
