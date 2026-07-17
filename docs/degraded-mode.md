# Degraded Mode

Use this ONLY when `codex-plugin-cc` is unavailable. The coordinator is
thinner, but the artifacts and gates do not change.

**The `FACTORY_DEGRADED=1` marker is mandatory.** The PreToolUse hook blocks
raw `codex exec` (the sanctioned runtime is `/codex:rescue` → the plugin
companion); prefixing the command with `FACTORY_DEGRADED=1` is the explicit,
auditable declaration that you are here because the plugin is down — not a
convenience bypass. The planning lock still applies: even degraded, writing
Codex runs are refused while the active task is unplanned.

## Exploration

Ask read-only questions directly (the explore profile pins terra @ high):

```bash
FACTORY_DEGRADED=1 codex exec --profile explore -s read-only "What files implement the billing workflow, and what tests cover it?"
```

## Implementation

Run Codex with the implementer prompt plus the bounded task text:

```bash
FACTORY_DEGRADED=1 codex exec "$(cat .agents/prompts/implementer.md)

Task:
Implement the approved leaf task from .factory/decomposition.json."
```

## Testing and Review

Use the existing specialist agents and record their JSON outputs:

```bash
python3 .agents/scripts/record_test_from_json.py --kind automated --input /tmp/automated.json
python3 .agents/scripts/verify.py
python3 .agents/scripts/record_review_from_json.py --aspect quality --input /tmp/quality.json
python3 .agents/scripts/record_review_from_json.py --aspect performance --input /tmp/performance.json
python3 .agents/scripts/record_review_from_json.py --aspect security --input /tmp/security.json
python3 .agents/scripts/record_test_from_json.py --kind functional --input /tmp/functional.json
python3 .agents/scripts/pr_ready.py
```

## Gates

Discovery and prototype stay lightweight. Before planning, record accepted client sign-off:

```bash
python3 .agents/scripts/record_signoff.py
```

After that, keep the normal `.factory` artifacts and run the same gates. Do
not bypass `verify.py`, review artifacts, or `pr_ready.py` — and go back to
`/codex:rescue` the moment the plugin is available again.
