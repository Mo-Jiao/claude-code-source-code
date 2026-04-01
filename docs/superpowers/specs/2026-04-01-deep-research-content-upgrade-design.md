# Deep Research + Content Upgrade Design

**Date:** 2026-04-01
**Goal:** Deepen tutorial content with industry research, adding "Why" analysis and industry context to each lesson

## Scope

- **In scope:** Harness Engineering trends research, Agent architecture patterns research, 16-lesson content enrichment
- **Out of scope:** Platform migration, Python examples, new diagrams

## Research Architecture

Two parallel research tracks, output as MD to `docs/research/`:

| Track | Focus | Method | Output |
|-------|-------|--------|--------|
| R1: Harness Engineering Trends | Context engineering evolution, harness vs framework, durability, production patterns | Agent tool (Tavily) → claude -p (deep analysis) | `05-harness-trends-deep-20260401.md` |
| R2: Agent Architecture Patterns | Agent loop philosophy, tool design (minimal vs specialized), compression trade-offs, bitter lesson in practice | Agent tool (Tavily) → claude -p (deep analysis) | `06-agent-architecture-deep-20260401.md` |

### Execution Flow

1. Launch 2 Agent-tool sub-agents for Tavily search (parallel)
2. Write search results to temp files
3. Launch 2 `claude -p` processes for deep analysis (parallel), loading deep-research skill
4. Persist reports to `docs/research/`

## Content Structure (Per Lesson)

Each of the 16 lessons gets two new sections:

### "Why: Design Decisions & Trade-offs"
- Why this approach over alternatives?
- How do other agents solve this?
- What are the trade-offs?

### "Industry Context"
- Related trends/discussions from research
- Cited sources

## Deliverables

1. `docs/research/05-harness-trends-deep-20260401.md`
2. `docs/research/06-agent-architecture-deep-20260401.md`
3. 16 lesson MD files updated with Why + Industry Context sections
4. Git commit

## Non-Goals

- No platform migration (content-first, platform decision deferred)
- No Python example scripts
- No new diagrams this round
