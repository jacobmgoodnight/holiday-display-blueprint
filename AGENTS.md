# Codex / contributor guidance — Holiday Display Blueprint

## Invariants

1. **Real data stays private.** Never commit plaintext house wiring, photos, private JSON backups, Excel master workbooks, street addresses, real household inventories or complete `#master=` share URLs. The public `shared-masters.v1.json` fixture is an *encrypted* recovery snapshot; the secret key must never enter GitHub source, build logs or server storage.
2. **Blueprint is the source of truth for current field wiring.** Historical Halloween and Christmas spreadsheets remain untouched/private. Excel reference exports are READ-ONLY snapshots, not two-way sync. Never silently merge workbook changes into a live synced project or replace a user's project with a newly imported draft.
3. **Electrical graph invariants:** max one input per item, no loops, valid source output ports, no two loads on one occupied port, no input to outlet, explicit connector-type checks. Validate all new links before persistence. Layout coordinates do not change electrical topology.
4. **Changes require reverification.** A changed incoming feed should mark the affected branch and project Draft; a previously checked old connection task is invalidated. Keep historical source/port changes understandable. Do not call these changes safety-certified.
5. **Electrical safety:** No assumed breaker sharing, outdoor GFCI, cable ratings, watt estimates, connector standards, or electrical capacity. The app is a documentation tool, NOT a safety inspector. Audio cables, BLE, HDMI and battery-only items must not be modeled as AC feeds.

## Synced local-first architecture

6. **No hardcoded secrets.** GitHub Pages hosts the browser code; IndexedDB contains local drafts/attached photos. An isolated Supabase `hdb_sync_vaults` table stores only AES-256-GCM encrypted snapshots, reachable through an authenticated-by-capability Edge Function. Never put the AES key in source, URL query parameters, SQL or logs. Keep direct table access revoked for anon/authenticated and RLS enabled. No service-role or secret keys in browser assets.
7. **Avoid data loss across devices.** Use per-project baselines and server compare-and-swap revisions; avoid silently overwriting independently edited projects. Offline changes remain local. Preserve one-device import and manual JSON backup/restore. Deletion handling and field-level conflict review need explicit design/tests before being described as supported.
8. **Cloud is optional.** Public starter fixtures and the diagram editor work without an account. The private link enables sync. Keep large photo limits, potential storage failure and browser quota visible, not hidden.

## Engineering workflow

9. Preserve existing project IDs, connection IDs where appropriate, checklist states, source row metadata, imported cord tags, and manual icon positions. A *new* physical connection should produce an unchecked new task; do not carry a stale done check over to it.
10. Per-project local saving is serialized and retried; do not reinstate an active-project-only debounced save effect or allow delayed writes to resurrect deleted records. Field Mode must reuse the same project/checklist data, never a separate copy. Project Verified requires recorded human inspection notes/exceptions, and never signifies electrical safety certification.
11. Named output labels are descriptive and do not alter physical output indices. Atomic insertion of cords/splitters into existing links must validate the entire graph and reset stale link checklists and downstream field verification. Fullscreen mobile should prioritize legible, outlet-focused zoom and a compact single-row toolbar; do not automatically shrink a wide system into unreadable nodes. Chrome controlled by iOS is outside the app.
12. Fullscreen Explore is strictly read-only: no node drag, connector creation, or deletion. Only explicit Builder actions may mutate the existing live power graph; never create a second diagram/project representation for fullscreen. Keep screen controls minimal, zoom/pan keyboard/touch accessible, and all edits using validated actions that invalidate stale field verification.
13. Run `npm test` and `npm run build` via GitHub Actions before merging. Tests should cover graph validation, exports, migration/backups, cloud conflicts, and Christmas O03 topology. Prefer one readable UI flow on mobile over advanced hidden controls.
14. GitHub Pages base path must remain `/holiday-display-blueprint/`. Never change other repositories or existing Supabase dinner-app tables without explicit permission.
15. Update **README.md**, **docs/ROADMAP.md**, and **docs/WIRING_WORKFLOW.md** when architecture, UI or feature completeness changes. Don't leave false statements such as "no backend", "no sync", or "not tested" after successful deployed CI.

## Unverified installation details

- Halloween 2026 porch: reconcile the later four carved-pumpkin/C7 modifications with the older 2026 workbook before treating the diagrams as fully as-built.
- Christmas O03: the short GREEN SPT-1 morning-room feeder plugs into a **female connection on a covered-porch C9 strand**, **not** directly into the WHITE SPT-1 upstream feeder. Exact strand/tap needs field verification.
- Starter fixtures never constitute an actual installed plan.
