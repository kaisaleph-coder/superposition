#!/usr/bin/env python3
"""Light-tier floor guard (PreToolUse hook). Exit 0 = allow, exit 2 = block.

DEPLOYED COPY — canonical source: E:\\ai_project_v1\\_meta\\foundation\\hooks\\floor_guard_light.py
Do not edit here; edit the canonical file and re-deploy.

Blocks ONLY credential surfaces and irreversible deletes. Push/publish are ASK
permissions in settings.json, not hook-blocked (light tier pushes with approval).
Fail closed (Law 1): malformed input or any internal error blocks.
"""
import json
import re
import sys

BLOCK = [
    (r"\brm\s+-[a-zA-Z]*r[a-zA-Z]*f|\brm\s+-[a-zA-Z]*f[a-zA-Z]*r", "recursive forced delete"),
    (r"\bRemove-Item\b(?=[^\n]*-Recurse)(?=[^\n]*-Force)", "recursive forced delete"),
    (r"\brmdir\s+/s\b|\bdel\s+/[sfq]", "recursive delete (cmd)"),
    (r"\bformat\s+[a-zA-Z]:", "disk format"),
    (r"(^|[\s;|&])(cat|type|gc|Get-Content|more|less)\s+[^\n]*\.env\b", "reading .env"),
    (r"\bsecrets[/\\]", "secrets directory"),
    (r"\bid_rsa\b", "private key"),
]
PATH_BLOCK = re.compile(r"(^|[/\\])(\.env($|\.)|secrets([/\\]|$)|id_rsa)", re.IGNORECASE)


def main() -> int:
    try:
        data = json.load(sys.stdin)
        tool = data.get("tool_name", "")
        ti = data.get("tool_input", {}) or {}
        if tool in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
            path = str(ti.get("file_path") or ti.get("notebook_path") or "")
            if PATH_BLOCK.search(path):
                print(f"floor: blocked write to credential surface: {path}", file=sys.stderr)
                return 2
            return 0
        if tool in ("Bash", "PowerShell"):
            hay = str(ti.get("command", ""))
            for pat, why in BLOCK:
                if re.search(pat, hay, re.IGNORECASE):
                    print(f"floor: blocked ({why}): {hay[:120]}", file=sys.stderr)
                    return 2
            return 0
        return 0
    except Exception as e:  # Law 1
        print(f"floor: fail closed on {type(e).__name__}: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
