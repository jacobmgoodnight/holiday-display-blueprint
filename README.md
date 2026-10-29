# Holiday Display Blueprint 🎃 🎄

**Your seasonal wiring, installation steps, photos, and equipment—usable at a computer or in the yard.**

[**Open the live app**](https://jacobmgoodnight.github.io/holiday-display-blueprint/) · [Wiring workflow](docs/WIRING_WORKFLOW.md) · [Roadmap](docs/ROADMAP.md)

> **Safety and accuracy:** Bundled examples are illustrative only. Your actual Halloween/Christmas master plans stay private. A documented power-feed graph or **Verified as-installed** status is **not an electrical safety inspection or certification**.

## Quick start

1. Open the [live app](https://jacobmgoodnight.github.io/holiday-display-blueprint/) from desktop or phone.
2. For your **real** seasonal masters, open your separately shared private `#master=…` link on each device; do not paste the key into GitHub. This links your browser to its existing encrypted Supabase vault.
3. On a phone, use **Field Mode**: choose O01/O02/O03, see the next unfinished task, search for any device, and check steps without dragging a wiring diagram.
4. On a desktop, use **Wiring** to review or modify the exact upstream component and numbered output port. Use **Needs Verification** to find missing sources and field checks.

Edits save locally in IndexedDB. The header reports **Saving locally**, **Saved locally**, or **Local save failed** with a retry; a separate cloud status reports encrypted sync. Online synchronization occurs while the app is open, not while a closed browser runs in the background.

## Fullscreen diagram: Explore or Builder

Select **Wiring → Fullscreen** on your computer, or **Field → Fullscreen diagram** on your phone. The same existing React Flow diagram fills the viewport (also on iOS Safari without depending on the native browser Fullscreen API).

- **Explore (default):** read-only. Pan by dragging empty space, pinch or scroll to zoom, use **+ / − / Fit**, switch **Whole system / O01 / O02 / O03 / zone**, search the entire project, tap an item to highlight its power path, or choose **Path only** to isolate that chain. Use **Exit** or Escape to return. Viewing never changes connectors or stored manual positions.
- **Builder (explicitly selected):** add a named outlet, smart plug, cord, SPT-1 feeder, splitter, C9 strand, projector or decoration; select an existing source and its unused output; tap the receiving item to wire it; disconnect or remove the selected item with confirmation. Builder uses the same graph constraints, local saving, verification invalidation and safe deletion undo as the regular editor.
- **Layout:** Auto power flow is for reading; **Move items manually** switches to existing saved coordinates and enables dragging in Builder. Switching back to Auto does not rewrite the saved manual positions. Unknown splitter sockets, C9 taps and lengths are never assumed from workbook text.

Builder works with **one documented AC power input per receiving item**, not HDMI, audio, BLE or battery-only control wiring. A recorded connection does not mean the circuit is electrically safe.

## Main features

| Area | What it does |
| --- | --- |
| **Field Mode** | Phone-friendly outlet selection, current setup progress, one-tap next step, readable connection tree, attached photos and equipment/storage notes, search across the full project, optional advanced diagram editor |
| **Wiring** | Graph-based outlets → cords/splitters/C9 strands → decorations; auto power-flow or saved manual layout; per-outlet focus, source tracing, and guided “Where does this plug in?” changes |
| **Install & Teardown** | Numbered generated tasks, shared checkboxes/notes/photos, downstream-first connection plan, printable outlet-specific guides |
| **Needs Verification** | Unconnected or unverified items, unknown cord lengths/load values, optional photos/connector reminders; no fabricated ratings |
| **Inventory** | Shared physical-item IDs, conditions, storage bins, repair notes and CSV export |
| **Data tools** | Private JSON backup/restore and read-only Excel reference export; source-aware workbook import creates separate draft data, **not** an automatic merge |

### Safe changes and recovery

- Wiring changes validate graph constraints, mark affected equipment **Draft** and invalidate old checked connection steps.
- Component deletion asks for confirmation, clears obsolete steps and marks surviving downstream items unverified. **Undo component removal** restores valid connections, but not stale verification/checkmarks.
- A per-project serialized save queue protects rapid edits and project switching from overlapping old writes. Failed local saves remain pending and retry.
- Marking a project **Verified as-installed** requires a human review note and timestamp; unresolved documentation findings are recorded as exceptions. It never means electrical certification.
- **Reverse last feed change** is limited to the latest guided rewire and never restores old verification.
- Cloud-linked project deletion is intentionally disabled until safe cross-device tombstones are implemented.

## Backups, sync and privacy

**GitHub Pages hosts public application code and an encrypted recovery snapshot—not readable household plans.** The private link's fragment holds the unlock key. The linked browser encrypts updates using AES-256-GCM; an isolated Supabase vault stores ciphertext. Anyone with the complete private link can unlock and modify the plans—keep it secret.

- **Local first:** Every edit saves to that browser. Disconnecting sync doesn't remove local projects. Clearing browser data may erase local-only edits.
- **Automatic, not instantaneous:** When open and linked, browsers periodically check for updates and retry after reconnecting. Sync conflicts involving the same project require an explicit choice; do not assume safe simultaneous coediting.
- **Recovery:** Download **Back up all projects (JSON)** before major changes. Backups may contain real photos and wiring; store them privately. Excel exports omit photos and are for reference/archive only.
- **Unverified behavior:** Large photo collections may exceed storage or cloud upload limits; a closed browser does not sync in the background. Project deletions do **not** propagate safely yet.

## Screenshots

No real household screenshots are published in this repository. For public documentation, capture the bundled **example** projects only. Screenshots of actual homes, private master links, and attached personal photos should remain private.

## Development

Requires Node.js 22+ and npm.

```bash
npm install --no-audit --no-fund
npm run dev
npm test
npm run build
```

Architecture: React + TypeScript + React Flow, Dexie/IndexedDB, Vite/Vitest, and the existing Supabase encrypted sync Edge Function. Deployment runs through GitHub Actions to **GitHub Pages**, using the base path `/holiday-display-blueprint/`. Tests and production build run before deployment.

See [AGENTS.md](AGENTS.md) for contribution and data-protection rules. See [docs/WIRING_WORKFLOW.md](docs/WIRING_WORKFLOW.md) for updating real wiring while keeping historical spreadsheets separate.

## Known limitations / next priorities

- **No two-way Excel master editing.** New workbook imports create drafts; reconciling source revisions needs a reviewed diff.
- **Missing connector/port facts remain unknown** until verified. The Halloween 2026 O01 additions and Christmas O03 exact covered-porch C9 female tap still need actual field reconciliation.
- **Offline data editing is supported once loaded**, but launching the app without a connection is not guaranteed until a tested, installable PWA caches the shell.
- **Cloud conflict handling is whole-project**, not fine-grained per checkbox/device. Project deletion tombstones and browser-level two-device tests remain future work.
- **Full undo/history is not available.** Only an immediate component removal receipt and a guarded latest feed reversal are implemented.
- **Electrical safety is manual.** Blueprint cannot test breaker capacity, GFCI operation, weather protection, or manufacturer load limits.

Track prioritized follow-ups in [docs/ROADMAP.md](docs/ROADMAP.md).
