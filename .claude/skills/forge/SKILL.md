---
name: forge
description: >-
  Operate the Symphony Forge harness: start tasks, save approved plans,
  record decisions and client sign-off, harvest the docs/context inbox,
  check gate status, and review proposed skills. Invoke when the user says
  "start a task", "save this plan", "record a decision", "harvest context",
  "is this PR ready", "harness status", or "/forge".
---

# Forge — harness operations

Canon lives in `AGENTS.md`, `WORKFLOW.md`, and `harness.yaml`
(<!-- canon: WORKFLOW.md -->). This skill only routes to it.

## Route by intent

| Dev says | Do |
|---|---|
| start a task / new feature | `python3 .agents/scripts/intake.py --issue <KEY> --title "<title>"` — then check `forge.py context list --pending` BEFORE planning |
| plan is approved | `python3 .agents/scripts/forge.py plan save --from <plan-file>` (plan must follow `.agents/prompts/planner.md`, incl. Decisions section) |
| record a decision | `python3 .agents/scripts/forge.py decision new <slug>` — human sets `status: accepted` + `confirmed_by`, never you |
| client signed off | `python3 .agents/scripts/record_signoff.py` |
| harvest context / process the dump | follow `.agents/prompts/harvester.md`, then `forge.py context mark ...` |
| harness status | read `.factory/run.json`; `forge.py context list --pending`; `ls .agents/skills/proposed/` |
| is this PR ready | `python3 .agents/scripts/pr_ready.py` (never bypass with ad hoc checks) |
| mine for skills / retro | follow `.agents/prompts/skill-miner.md` |
| machine setup | `python3 .agents/scripts/forge.py doctor` |

## Hard rules

- Implementation is delegated to Codex (`/codex:rescue`); planning exploration
  is Codex read-only. See `harness.yaml` for phase owners.
- Never set a decision to `accepted`, never flip `client_signoff`, never
  activate a proposed skill — humans do those.
- If `check_dual_runtime.py` fails, fix the violation it names before anything else.
