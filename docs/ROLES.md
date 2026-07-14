# ROLES.md — who does what, and how work hands off

The harness is prompt-first for every role: say the phrase, the agent runs
the command. `./forge next` tags each step with the role that acts —
`[PM]`, `[EM]`, `[dev]`. This page is the map per seat.

## PM — product manager

Owns the business truth: what we're building and why.

| You do | You say / run |
|---|---|
| Discovery conversation | "Let's run office hours" (gstack `/office-hours`) |
| Product intent | own `docs/product/DISCOVERY.md` + `BRIEF.md` |
| Client decisions | "Record that as a decision" → you are the human who runs `./forge decision accept <slug> --by "<you>"` |
| Client sign-off | the `client-signoff` decision + `record_signoff.py` — nothing proceeds without you |
| **Epics (the PM→EM handoff)** | after sign-off, the project-level decomposition proposes epics; you review them, then accept: `./forge decision new epics-approved` (list the epics in it) → `./forge decision accept epics-approved --by "<you>"`. **Roadmap import is refused until this exists.** |
| Scope changes later | epics live in `plans/roadmap.json` (`epics` block) — change them by PR |

## EM — engineering manager

Owns the backlog shape and distribution: epics → stories → devs.

| You do | You say / run |
|---|---|
| **Stories (the EM→dev handoff)** | after the PM accepts epics: "record the roadmap" → `./forge roadmap import --input <json>` — items carry `story`, `acceptance_criteria`, `epic`, `skill` (frontend/backend/fullstack), execution `order` |
| Groom / extend | `./forge roadmap add <KEY> "<title>" --epic <id> --skill <s>`; edit `plans/roadmap.json` by PR |
| Define the team (optional, recommended) | `./forge team set <handle> --role dev --skills frontend,backend` — makes distribution checkable |
| Distribute | `./forge roadmap assign <KEY> --to <dev>` — validated against the roster; match item `skill` to dev skills (a fullstack dev can take anything; specialists take their lane). Assignments survive re-imports |
| Watch the board | `./forge roadmap list` (grouped by epic, shows @assignee) — `forge next` flags unassigned pending items to you |
| Plan quality | a dev's plan approval (`forge plan save`) is your review point — the plan must satisfy the story's acceptance criteria |

## dev — developer

Owns one story at a time, on its own branch (see Concurrency in WORKFLOW.md).

| You do | You say |
|---|---|
| Pick your story | "what's next?" — `forge next` names the next pending item (and its assignee); intake creates your branch |
| Plan → implement → ship | the feature loop: "Plan this task" → "Implement it" → "Review it" → "Is this PR ready?" — every step is gated and prompt-first (docs/getting-started.md §8) |
| Assumptions | "record an assumption" the moment you make a call the plan doesn't cover |
| Full-stack vs specialist | your roster `skills` say what the EM routes to you; a story's `skill` field says what it needs |

## Handoff summary

```text
client ──sign-off gate──▶ PM ──epics-approved gate──▶ EM ──roadmap item + assign──▶ dev
   (decision + record_signoff)   (decision accept)        (intake activates; pr_ready closes)
```

Every handoff is an artifact plus a gate — never a conversation that
evaporates. Humans accept; agents do the rest.
