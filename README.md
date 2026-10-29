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
- **Where does this plug in?** Select a component → **Trace source**. **If unplugged** shows all downstream dependencies.
- **Setup and teardown:** generated per graph with downstream wiring before the final source connection; task completion and notes persist locally.
- **Photos and inventory:** attach compressed reference images, add a property-photo backdrop, record storage bins, quantity, purchase dates, costs, repair notes, condition, and ratings. Link common assets across seasons. CSV inventory export.
- **Workbook import wizard:** choose sheet/header row, assign ID/name/type/zone or source/target/output columns, preview row results, review rejections, retain unmapped columns as metadata. Import components first, then connections. **Embedded workbook images are not imported** and the original workbook remains untouched.
- **Private backup:** JSON export / restore (including photos), browser IndexedDB, no authentication or backend.
- **Printing:** browser print view of the wiring map; consider PDF print via system print dialog. A calibrated multi-page schematic is a roadmap item.

### Source-aware master workbook import (local-only)

**For the 2026 plans:** Use the separately supplied private two-season JSON backup through **More actions → Restore JSON backup**. It creates two real, *unverified* seasonal wiring drafts. **Never commit this private JSON, household photos or workbooks to your public GitHub repository.**

For future workbook revisions, use **Import workbook**. The wizard now recognizes the Halloween `2026 Connections` sheet, preserves component IDs, upstream links, port labels, status, source-row information and 2026 Cord Tags. Audio, BLE and battery-only records are excluded from AC wiring. Invalid/unconfirmed links are reported, not silently connected.

The Christmas `Cords & Connections` master is narrative: it has no stable ID-to-ID electrical edge table. To avoid inventing plug connections, direct workbook import creates clearly labeled *disconnected review items*. The separately prepared private two-season backup contains a cautious, source-informed Christmas wiring draft with the covered-porch C9 female-to-morning-room distinction. Verify all provisional tap and splitter positions in the field.

Both imports create new drafts; existing projects are not overwritten. Embedded workbook photos and drawn shapes are not automatically extracted. Attach photos in the local app.

### First time with your real master workbooks

1. Create a **blank project** first. Do not use the illustrative fixture as an installed plan.
2. Choose **Import workbook**, select your local `.xlsx`, and inspect each worksheet. Select the relevant header row and map its columns to component fields. Import one structured component sheet at a time.
3. For structured connection sheets, map source ID, target ID and (optional) 1-based source-output port. IDs must exactly match the imported component IDs. Each missing/invalid link is reported as skipped; it is never silently added.
4. Review names, connections and ratings. Attach your own photos locally. Change status to **Verified as-installed** only after inspection; this status never constitutes electrical safety approval.
5. **Backup all projects** and keep the JSON somewhere secure. Export/import between your computer and phone; browser storage does not synchronize across devices.

For workbooks with irregular merged-cell wiring tables, multiple row headings or diagrams made of shapes, map the sheets manually or normalize them into simple ID-based tables before import. This MVP **does not reconstruct wiring from drawn Excel shapes**.

## Data and privacy

All projects and compressed photos are saved in **IndexedDB in your own browser on that device**; browser data can be lost if cleared or in a private browsing window. No data are transmitted by the application. All application styling uses local system-font fallbacks. The two fixture projects contain no identifying photos, precise property coordinates or actual home inventory.

**A public GitHub Pages site is public software, not private cloud storage.** It does *not* publish your locally imported data. JSON backups do include potentially sensitive photos/location information and should never be committed to a public repository. `.gitignore` excludes spreadsheets, common photo extensions, private folders, and `*.backup.json`.

## GitHub Pages (public site)

The source repository is public and the GitHub Actions workflow automatically builds and attempts to deploy the app after tests pass on `main`. The expected public address is:

**https://jacobmgoodnight.github.io/holiday-display-blueprint/**

**Required one-time GitHub setting:** Open [Settings → Pages](https://github.com/jacobmgoodnight/holiday-display-blueprint/settings/pages) and select **Build and deployment → Source: GitHub Actions**. This setting cannot be changed by the repository source-code workflow itself with its default token. If this setting was already selected, the next push runs the pipeline; otherwise select it and then use **Actions → Test, build, and deploy → Run workflow** on `main`.

No `ENABLE_PAGES` variable is needed. Public-repository pushes to `main` trigger test, build, and deploy, but pull requests only run verification. For safety, the deployment job skips when the repository is private.

Check the [Actions runs](https://github.com/jacobmgoodnight/holiday-display-blueprint/actions) to confirm an actual successful deployment before treating the site as live.

**Privacy:** Hosting the public React app does not publish locally imported plans, images, or inventory records; those remain in each browser's IndexedDB. Do not put workbook files, private backups, or house photos in the repository or in public fixtures. Devices do not automatically sync their browser data.

## Electrical safety limitations

A valid wiring graph is **not** an electrical inspection. The application does not measure current, breakers, GFCI, weatherproofing, receptacle integrity, cord gauge, startup load, manufacturer instructions or circuit sharing. Empty ratings are explicitly flagged. Do not treat connections, suggested phases or an “as-installed” badge as a safety determination. Never rearrange live connections based solely on this diagram.

## Structure

- `src/lib/model.ts` — typed project, components, inventory and connections
- `src/lib/graph.ts` — validation, tracing and checklist generation
- `src/lib/storage.ts` — IndexedDB saves and JSON backup/restore
- `src/lib/excel.ts` — workbook reader and mapping logic
- `src/fixtures/examples.ts` — anonymous illustrative sample diagrams
- `src/components/*` — React Flow nodes and import wizard
- `src/tests/*` — graph integrity and persistence tests
- `docs/ROADMAP.md` — next priorities / integration boundaries
- `AGENTS.md` — project rules for Codex

No code or data from GlowRoute or Pumpkin Family Organizer are modified. The architecture borrows local-backup and season/version ideas while keeping this application separate.