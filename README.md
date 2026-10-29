# Holiday Display Blueprint 🎃 🎄

**The wiring map you wish you had at teardown.** A local-first holiday-display planner for real seasonal installations: model actual outlet-to-decoration connections, trace what powers each device, plan installation, track inventory, and back up your work.

> **MVP / preview:** The bundled Halloween and Christmas diagrams are **illustrative drafts**, not verified electrical plans. No house photos, precise locations, personal inventory or actual installation details are included in this source repository. The example Christmas O03 chain models the user-confirmed logical detail: *a short green SPT-1 morning-room feeder plugs into the female end of a covered-porch C9 strand*, not into a white SPT-1 feeder. Exact strand identity, ratings and as-built status remain unverified.

## Quick start

Requires Node.js 22+ and npm:

```bash
npm install --no-audit --no-fund
npm run dev
```

Open the local URL printed by Vite. To run checks:

```bash
npm test
npm run build
```

### Which is the master: Blueprint or the old Excel workbooks?

**Use Holiday Display Blueprint as the live, synced wiring record.** Keep the original Halloween and Christmas Excel masters as **private historical reference files**, especially for original diagrams and embedded photos. Do not simultaneously maintain two editable master copies.

To change a real plug connection: open the correct master project → **Wiring diagram → O01/O02/O03 → Diagram editor → Find** the item. Select the component; its **Where does this plug in?** card lets you choose the exact existing upstream component and numbered output. Saving replaces the existing feed, rather than adding a second input, and validates the power graph. Changed branches revert to **Draft**, downstream component verification is cleared, and the previous connection checklist completion is invalidated. A compact history records guided wiring edits. Recheck actual wiring before marking field verification again.

The **Export Excel reference** button (also in **More actions**) downloads a private `.xlsx` snapshot containing components, power links, setup/teardown steps, review warnings, and wiring-change history. **This export is for reading/archiving, not two-way Excel sync.** Editing the exported workbook will not alter the app; reimporting is not an automatic merge. No images are embedded in this export—use the private JSON backup to retain attached photos.

For the full practical procedure, see **[docs/WIRING_WORKFLOW.md](docs/WIRING_WORKFLOW.md)**.

### Automatic encrypted phone + desktop synchronization

Holiday Display Blueprint uses GitHub Pages for the **public application**, and an isolated Supabase encrypted vault for your **private project data**. Your real wiring information, photos, and checklist notes are never committed to the public GitHub repository.

- **Setup once per device:** Open your complete private `#master=...` link. The browser stores the device's key locally (never in the public repo) and opens the Halloween / Christmas master projects. You do not need an account or ongoing file transfers.
- **Automatic sync:** Changes are encrypted with **AES-256-GCM** in your browser and sent to a private, versioned cloud vault. Changes are checked shortly after editing, every 20 seconds while the app is open, and when the page regains focus or comes online. Other linked devices receive those changes automatically on their next check.
- **Offline-first:** Every edit still saves to IndexedDB locally. The sync bar indicates an offline condition and retries when the connection returns.
- **Conflict protection:** The server rejects outdated writes (compare-and-swap revision checks). The app tracks hashes of synced projects; independent edits to the same project on both devices produce a visible choice instead of silently overwriting. Export a backup before using **Keep this device** or **Use cloud version**.
- **Limited scope:** Starter example projects are not uploaded. The existing hosted `shared-masters.v1.json` is an encrypted **recovery snapshot**, not a live database or source of truth for edits. Future changes use the cloud vault.
- **Disconnect:** **More actions → Stop syncing this device** forgets the private key in that device's local storage. Already stored local plans are preserved.
- **Security:** The link contains a 256-bit secret in its URL fragment, which is not transmitted to GitHub on page load. A separately derived capability token authenticates sync requests to the Edge Function over HTTPS. The server holds ciphertext only. Supabase table RLS is enabled and direct anon/authenticated table grants are revoked. Possession of your private link authorizes read/write access; anyone with the full link can access and change these projects.
- **Limitations:** This is **periodic sync, not realtime multiuser co-editing**. Simultaneous offline edits can require manual conflict resolution. Data on shared devices should be protected by the device's screen lock. Large photo bundles can exceed the sync service's payload limit; the app keeps local data and shows an error.

The Supabase storage is isolated in `hdb_sync_vaults` and does not alter other apps or their tables. The deployed project does not require a new paid Supabase project.

### Manual transfer / backup (fallback only)

The **private master link** is the preferred way to activate encrypted cloud sync on a new device. A JSON backup is useful for offline recovery, migration, or before resolving sync conflicts:

1. From a device with the latest project, choose **Back up all projects (JSON)** (or **Backup** in the desktop header).
2. Store the file privately, e.g. in your personal OneDrive. It can include photos, checklist notes and house wiring. Do not commit it to GitHub.
3. On another browser, use **More actions → Restore JSON backup** and confirm any replacement of matching project IDs.

Device-to-device syncing only occurs after each browser has been explicitly linked with the same private URL fragment. When offline, edits are saved locally and pending sync retries next time the app is open and online.

### Photo-assisted, outlet-specific printed installation guide

Select **Wiring diagram → O01/O02/O03 → Simplified install view**. The installer view now shows any attached component or task photo beside its numbered steps and includes recorded equipment notes.

Use **Print this view** to expand all branches automatically, show the selected circuit's components and numbered tasks, and open your browser's print dialog. You can print the sheet or choose **Save as PDF** (where supported). For a whole-house guide choose **Whole system** first; for the easiest yard reference print one outlet at a time.

The printout contains household wiring and photos from **your browser**, so treat printed copies and PDF files as private. The public repository contains no private installation data.

### Simplified installation guide

In **Wiring diagram**, choose **Simplified install view** and select your O01/O02/O03 outlet from **Focus circuit**.

- Every recorded outlet is shown as a power-branch tree. Collapse a splitter, smart plug, or other branch to hide its downstream devices; **Collapse all / Expand all** handles the complete view.
- Known cord length, type and color appear on the receiving cord, and the diagram editor also labels relevant connections. Missing lengths remain unknown (never invented).
- Numbered setup steps come from the same downstream-first dependency checklist used in **Installation steps**. Completion checkboxes are shared, and previously recorded notes remain available.
- Select any item or step to jump to its highlighted power path in the diagram. The guide is read-only and never modifies electrical connectivity or saved manual diagram positions.
- Disconnected items are identified for review. The guide is not an electrical safety inspection.

### Faster wiring navigation

- The diagram opens in **Auto power flow** mode: outlets lead left-to-right through smart plugs, cords, splitters, and decorations. Layout is computed in memory and does not rewrite the imported workbook, electrical graph, or saved manual node positions.
- The **Focus circuit** strip switches directly between O01, O02, O03 and the whole system, using the outlets actually present in your selected seasonal project. Large imported projects open on their first outlet instead of a tiny overview.
- The **Where does it plug in?** finder lists destinations and their complete upstream chain. Search by item, cord, zone, or outlet; select an entry to highlight and center the path. Choose **Include cords, splitters, and outlets** for intermediate components.
- **Path only** temporarily hides unrelated diagram nodes. Disable it to restore the outlet view. **My saved positions** switches back to editable manual placement; auto layout disables dragging to protect saved coordinates.
- These are viewing and navigation features, not electrical certification. Master plans remain private browser data.

### What works now

- **Two season starters:** Halloween and Christmas 2026; create a blank project or copy the existing project to next year (copies remain draft).
- **Real directed electrical graph:** output-port limits, at most one input per device, no loops, no connections into house outlets, explicit male/female mismatch checks; connections are graph records, independent of icon positions.
- **Interactive editor:** drag, pan, zoom, connect via output/input handles, delete connections, add components, edit names/zones/colors/lengths, replace an existing feed safely in the graph, and isolate a zone or outlet circuit.
- **Field wiring edits:** select a non-outlet component → **Where does this plug in?** → choose the upstream component/output and confirm. This validates port availability, records a change, clears affected verification and rewired checklist progress. **Trace source** and **If unplugged** remain available for review.
- **Setup and teardown:** generated per graph with downstream wiring before the final source connection; task completion and notes persist locally.
- **Photos and inventory:** attach compressed reference images, add a property-photo backdrop, record storage bins, quantity, purchase dates, costs, repair notes, condition, and ratings. Link common assets across seasons. CSV inventory export.
- **Workbook import / reference export:** inspect and import structured sheets as separate draft data, and export current plans as readable private Excel reference snapshots. No safe Excel-to-live-master reconciliation exists yet. **Embedded workbook images are not imported**, and original workbooks remain untouched.
- **Private backup and sync:** JSON export / restore (including photos), browser IndexedDB, and opt-in end-to-end encrypted cross-device sync.
- **Printing:** browser print view of the wiring map; consider PDF print via system print dialog. A calibrated multi-page schematic is a roadmap item.

### Source-aware master workbook import (local-only)

**For the 2026 plans:** Use the separately supplied private two-season JSON backup through **More actions → Restore JSON backup**. It creates two real, *unverified* seasonal wiring drafts. **Never commit this private JSON, household photos or workbooks to your public GitHub repository.**

For future workbook revisions, use **Import workbook**. The wizard now recognizes the Halloween `2026 Connections` sheet, preserves component IDs, upstream links, port labels, status, source-row information and 2026 Cord Tags. Audio, BLE and battery-only records are excluded from AC wiring. Invalid/unconfirmed links are reported, not silently connected.

The Christmas `Cords & Connections` master is narrative: it has no stable ID-to-ID electrical edge table. To avoid inventing plug connections, direct workbook import creates clearly labeled *disconnected review items*. The separately prepared private two-season backup contains a cautious, source-informed Christmas wiring draft with the covered-porch C9 female-to-morning-room distinction. Verify all provisional tap and splitter positions in the field.

Both imports create new drafts; existing projects are not overwritten. Embedded workbook photos and drawn shapes are not automatically extracted. Attach photos in the local app.

### Importing historical workbook revisions

The Halloween importer recognizes the structured `2026 Connections` data; the Christmas source is mostly narrative, so it creates unconnected review items rather than guessing exact plugs. Import creates a **new draft** (or adds manually mapped records), not a verified update of an already-synced master.

If an old workbook contains newer facts, compare them with the live Blueprint project and update each affected source/output in Blueprint. Preserve the workbook privately as evidence; export a fresh Excel reference from Blueprint after verification. Never treat an illustrative example as a current installation record.

## Data and privacy

All projects and compressed photos are saved in **IndexedDB in your own browser on that device**; browser data can be lost if cleared or in a private browsing window. When private sync is enabled, only encrypted project snapshots are transferred to the cloud vault. All application styling uses local system-font fallbacks. The two fixture projects contain no identifying photos, precise property coordinates or actual home inventory.

**GitHub Pages serves the public app code and an encrypted recovery snapshot; the live private sync vault is separate.** Plaintext wiring, photos, master Excel workbooks and private backups are not intentionally published. JSON and exported Excel contain household installation details and should never be committed to GitHub. `.gitignore` excludes spreadsheets, common photo extensions, private folders, and `*.backup.json`.

## GitHub Pages (public site)

The source repository is public and the GitHub Actions workflow automatically builds and attempts to deploy the app after tests pass on `main`. The expected public address is:

**https://jacobmgoodnight.github.io/holiday-display-blueprint/**

**GitHub Pages is already configured and deployed.** If deployment is ever reconfigured, check [Settings → Pages](https://github.com/jacobmgoodnight/holiday-display-blueprint/settings/pages) for **Build and deployment → Source: GitHub Actions**. Use the Actions page to inspect deploy failures.

No `ENABLE_PAGES` variable is needed. Public-repository pushes to `main` trigger test, build, and deploy, but pull requests only run verification. For safety, the deployment job skips when the repository is private.

Check the [Actions runs](https://github.com/jacobmgoodnight/holiday-display-blueprint/actions) to confirm an actual successful deployment before treating the site as live.

**Privacy:** Hosting the public React app does not publish locally imported plans, images, or inventory records; those remain in each browser's IndexedDB. Do not put workbook files, private backups, or house photos in the repository or in public fixtures. Devices only sync through the encrypted, explicitly linked private vault—not through public GitHub Pages storage.

## Electrical safety limitations

A valid wiring graph is **not** an electrical inspection. The application does not measure current, breakers, GFCI, weatherproofing, receptacle integrity, cord gauge, startup load, manufacturer instructions or circuit sharing. Empty ratings are explicitly flagged. Do not treat connections, suggested phases or an “as-installed” badge as a safety determination. Never rearrange live connections based solely on this diagram.

## Structure

- `src/lib/model.ts` — typed project, components, inventory and connections
- `src/lib/graph.ts` — validation, tracing and checklist generation
- `src/lib/storage.ts` — IndexedDB saves and JSON backup/restore
- `src/lib/excel.ts` — workbook reader and mapping logic
- `src/lib/wiringEdits.ts` — checked power-feed changes and wiring history
- `src/lib/wiringExport.ts` — private Excel reference snapshots (not round-trip editing)
- `src/hooks/useSharedSync.ts` / `src/lib/cloudSync.ts` — encrypted cross-device synchronization
- `supabase/functions/holiday-blueprint-sync/` — encrypted vault Edge Function source
- `docs/WIRING_WORKFLOW.md` — how to update the real plans and archive old spreadsheets
- `src/fixtures/examples.ts` — anonymous illustrative sample diagrams
- `src/components/*` — React Flow nodes and import wizard
- `src/tests/*` — graph integrity and persistence tests
- `docs/ROADMAP.md` — next priorities / integration boundaries
- `AGENTS.md` — project rules for Codex

No code or data from GlowRoute or Pumpkin Family Organizer are modified. The architecture borrows local-backup and season/version ideas while keeping this application separate.