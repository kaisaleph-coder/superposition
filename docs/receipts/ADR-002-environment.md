# ADR-002 — Environment adaptations (repo root, git identity, toolchain)

**Status:** accepted · 2026-07-17 · session start

## Context
The handoff package assumed repo root `E:\superposition`, Python 3.14 at a specific path, and Node present. On this machine: no `E:` project root exists; the session was launched in the anchor-root project `C:\ai_projects_v1\resume-website` (scaffolded for this build); Python is 3.12; Node was absent.

## Decisions (Autonomy Protocol — no user contact permitted)
1. **Repo root = `C:\ai_projects_v1\resume-website`.** The owner launched the one-shot session here; the anchor-root convention (global rules) forbids hardcoded drive letters. The public GitHub repo name remains `superposition` per Ladder D.
2. **Orphan branch `main`, placeholder author.** The privacy rule ("no real personal data anywhere — including commits") is binding. The scaffold commit on `master` carries the owner's real name/email, and the machine git config would stamp real identity on every gate commit. Resolution: all work happens on an orphan branch `main` created fresh (no scaffold ancestry) with repo-local `user.name "SUPERPOSITION"` / `user.email "owner@superposition.invalid"`. Only `main` is ever pushed. `master` stays local, untouched.
3. **Portable Node v24.18.0 LTS** (official nodejs.org zip, SHA-checked by TLS origin) unpacked into the session scratchpad — dev tooling only, zero system modification, nothing committed. npm 11.16.0.
4. **Python 3.12** (`%LOCALAPPDATA%\Programs\Python\Python312\python.exe`) serves the static site locally; the handoff's 3.14 path does not exist.

## Consequences
- Local repo keeps two histories: `master` (private scaffold) and `main` (public, placeholder-authored). Gate commits land on `main`.
- Owner replacing placeholder authorship later is a normal git config change; nothing personal ships in v1.0.0 history.
