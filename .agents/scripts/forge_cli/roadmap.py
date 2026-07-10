"""forge roadmap — the durable project backlog (plans/roadmap.json).

Task-scoped .factory state is cleared on every intake; this file is the
cross-task handoff artifact: every feature left to build, in execution order.
It is recorded once from the project-level decomposition after sign-off,
then refined by PR. intake marks items active, pr_ready marks them done,
and `forge next` suggests the next pending one.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from factory_lib import dump_json, load_json, now_iso, repo_root, validate_payload

from .common import fail

# Set by the lifecycle scripts, never by import — re-importing a refined
# roadmap must not resurrect or un-finish items.
LIFECYCLE_FIELDS = {"status", "completed_at", "history"}


def roadmap_path(base: Path) -> Path:
    return base / "plans" / "roadmap.json"


def load_items(base: Path) -> list[dict]:
    return load_json(roadmap_path(base), default={}).get("items", [])


def save_items(base: Path, items: list[dict]) -> None:
    items.sort(key=lambda item: item.get("order", 0))
    roadmap_path(base).parent.mkdir(parents=True, exist_ok=True)
    dump_json(roadmap_path(base), {"updated_at": now_iso(), "items": items})


def mark_status(base: Path, key: str, status: str, **extra: str) -> bool:
    """Flip an item's lifecycle status; False if the key is not on the roadmap."""
    items = load_items(base)
    for item in items:
        if item.get("key") == key:
            item["status"] = status
            item.update(extra)
            save_items(base, items)
            return True
    return False


def cmd_import(args: argparse.Namespace) -> None:
    base = Path(args.repo).resolve() if args.repo else repo_root()
    source = Path(args.input).expanduser()
    if not source.is_file():
        fail(f"roadmap input {source} not found")
    try:
        payload = json.loads(source.read_text())
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {source}: {exc}")
    if not isinstance(payload, dict):
        fail('roadmap input must be {"generated_by": "...", "items": [...]}')
    validate_payload(base, "roadmap", payload)
    incoming = payload["items"]
    if not incoming:
        fail("roadmap input has no items")
    seen: set[str] = set()
    for pos, item in enumerate(incoming, 1):
        if not isinstance(item, dict) or not item.get("key") or not item.get("title"):
            fail(f"roadmap item {pos} needs at least 'key' and 'title'")
        if item["key"] in seen:
            fail(f"duplicate roadmap key: {item['key']}")
        seen.add(item["key"])
    existing = {item["key"]: item for item in load_items(base)}
    merged: list[dict] = []
    added = updated = 0
    for pos, item in enumerate(incoming, 1):
        entry = existing.pop(item["key"], None)
        if entry is None:
            entry = {"status": "pending"}
            added += 1
        else:
            updated += 1
        entry.update({k: v for k, v in item.items() if k not in LIFECYCLE_FIELDS})
        entry["order"] = item.get("order", pos)
        merged.append(entry)
    # Items on the roadmap but absent from the input are kept — removing
    # scope is a deliberate PR edit, never a silent import side effect.
    kept = list(existing.values())
    merged.extend(kept)
    save_items(base, merged)
    summary = f"Roadmap: {added} added, {updated} updated"
    if kept:
        summary += f", {len(kept)} existing item(s) kept"
    print(f"{summary} -> {roadmap_path(base).relative_to(base)}")


def cmd_add(args: argparse.Namespace) -> None:
    base = Path(args.repo).resolve() if args.repo else repo_root()
    items = load_items(base)
    if any(item.get("key") == args.key for item in items):
        fail(f"{args.key} is already on the roadmap")
    order = max((item.get("order", 0) for item in items), default=0) + 1
    item = {"key": args.key, "title": args.title, "order": order, "status": "pending"}
    if args.epic:
        item["epic"] = args.epic
    items.append(item)
    save_items(base, items)
    print(f"Added {args.key} to the roadmap (order {order})")


def cmd_list(args: argparse.Namespace) -> None:
    base = Path(args.repo).resolve() if args.repo else repo_root()
    items = load_items(base)
    if not items:
        print("No roadmap yet — record the project decomposition as the backlog: "
              "./forge roadmap import --input <json> (see .agents/prompts/decomposer.md)")
        return
    marks = {"pending": " ", "active": ">", "done": "x"}
    shown = 0
    for item in items:
        status = item.get("status", "pending")
        if args.pending and status != "pending":
            continue
        shown += 1
        epic = f" [{item['epic']}]" if item.get("epic") else ""
        print(f"[{marks.get(status, '?')}] {item.get('order', 0):>3}. "
              f"{item['key']} — {item['title']}{epic}")
    done = sum(1 for item in items if item.get("status") == "done")
    if args.pending and not shown:
        print("Nothing pending — everything is in flight or done.")
    if not args.pending:
        print(f"({done}/{len(items)} done)")
