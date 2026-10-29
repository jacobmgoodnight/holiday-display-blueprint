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

## GitHub Pages (optional, explicit opt-in)

The source is already on the `main` branch at <https://github.com/jacobmgoodnight/holiday-display-blueprint>.

**Pages is not enabled by default.** GitHub Pages may publish the application publicly even when the source repository is private, and private-repository eligibility depends on your GitHub plan. Do **not** use Pages as cloud storage for house photos: browser data stays local and is never included in the site bundle.

To deploy deliberately:

1. In repository **Settings → Pages**, choose **Build and deployment → Source: GitHub Actions**. If that option is unavailable, check your plan's private-repo Pages eligibility or choose to make the repository public only after reviewing privacy implications.
2. In **Settings → Secrets and variables → Actions → Variables**, create a repository variable named `ENABLE_PAGES` with value `true`.
3. Open **Actions → Test and build → Run workflow** on `main`. The workflow verifies, builds and deploys to `https://jacobmgoodnight.github.io/holiday-display-blueprint/` if Pages has been configured.
4. Without that variable, CI runs all tests and the production build, but **skips** the optional deployment job.

You can keep the application private and run it locally via `npm run dev` without enabling Pages. This MVP does not require any cloud service.

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