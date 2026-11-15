# Holiday Display Blueprint 🎃 🎄

**Your seasonal wiring, installation steps, photos, and equipment—usable at a computer or in the yard.**

[**Open the live app**](https://jacobmgoodnight.github.io/holiday-display-blueprint/) · [Wiring workflow](docs/WIRING_WORKFLOW.md) · [Roadmap](docs/ROADMAP.md)

Holiday Display Blueprint is a local-first, mobile-friendly planner for Halloween and Christmas installations. Lay out lights and cords on property photos, document power connections, track reusable lighting inventory, and follow install checklists in the field. Optional encrypted sync helps keep approved plans available across devices.

> **Safety and accuracy:** Bundled examples are illustrative only. Your actual Halloween/Christmas master plans stay private. A documented power-feed graph or **Verified as-installed** status is **not an electrical safety inspection or certification**.

## Starting a new display

Open **Menu → New display** on a phone, or **More actions → New display** on a computer. Name the plan and choose its season and year. It starts as a separate local draft with no equipment or connections. On Home, choose **Add a power source** if you know the outlet, or **Add equipment first** if the power source is not yet known.

Choose a type such as an extension cord, light strand, splitter or decoration, and choose its area. Add items one after another; enter known details or leave output counts unknown until you can check. You can leave a feed unconnected, choose its actual source and output while adding, or use **Connect an existing item** later. Reuse equipment from another display without copying its old power connections. New connections remain unverified.

Choose **Wiring diagram → Property photo**, or start with a photo from an empty display. Choose **Draw lights** or **Draw cord**, select an area, tap at least two points along the route and save to create the item and its visual route together. You can also choose an equipment type and area and tap the photo to place items repeatedly. New items have no power connection, and their output counts remain unknown until you record them. Tap a marker to see its actions directly below the photo, drag it to move it, or use fine-tune controls. Find unplaced items under **Browse equipment**.

Once a photo is loaded, the photo is the first thing on the page. On a wide screen the planning tools (undo, draw a run, add items, preview, browse equipment, measurements) sit in a column beside it; on a phone they follow below it, and the page scrolls back to the photo when you choose something to place or draw.

Select a light strand or cord and choose **Draw route**; tap points along its path and save. Use **Edit route points** to adjust an existing route, with touch, mouse or keyboard controls. Zoom, pan, search, filter and hide marker names to work on a crowded view. Select **Edit details here** to rename an item or **Place another like this** to add a separate unconnected item. To record wiring, select an unconnected item and choose **Connect**, then tap or choose its actual power source, record its output count if unknown, and explicitly select an available output. Connections remain unverified. Existing wiring and compatibility validation still apply.

After saving a new drawn route, use **Name or edit**, **Connect**, **Draw another**, or **Estimate length** to continue. Photo **Undo / Redo** shares the same bounded session history as the diagram, including marker moves, route and scale edits, and creating an item with its route. Finish or discard an unfinished photo draft before undoing. Replacing or removing a photo clears this session history; private restore points and backups remain separate.

Use **Add view** for up to eight named property photos. The same equipment can appear in several views without being duplicated; markers, routes and scale are independent for each image. Existing single-photo plans remain the main view. The compressed photos and layouts live in the project, private JSON backup and linked encrypted sync and count toward storage limits. Replacing or removing an image removes that view's markers and routes after confirmation. Save route and measurement drafts before leaving the planner.

Under **Measurements & materials**, mark the ends of a known distance and enter its actual length to estimate a saved route. A field-measured route length can be recorded separately and compared with known equipment lengths and explicitly linked lighting records. Photo estimates are approximate and never update inventory counts. **Preview lights & power path** offers illustrative bulb colors, relative spacing, decoration icons and a darkened photo; it can show saved connections between placed markers as a schematic. These visuals do not establish a physical cord route, count bulbs or change electrical connections.

## Quick start

1. Open the [live app](https://jacobmgoodnight.github.io/holiday-display-blueprint/) from desktop or phone.
2. For your **real** seasonal masters, open your separately shared private `#master=…` link on each device; do not paste the key into GitHub. This links your browser to its existing encrypted Supabase vault.
3. On a phone, use **Field Mode**: choose O01/O02/O03, see the next unfinished task, search for any device, and check steps without dragging a wiring diagram.
4. On a desktop, use **Wiring** to review or modify the exact upstream component and numbered output port. Use **Needs checking** to find missing sources and field checks.

Edits save locally in IndexedDB. The header reports **Saving locally**, **Saved locally**, or **Local save failed** with a retry; a separate cloud status reports encrypted sync. Online synchronization occurs while the app is open, not while a closed browser runs in the background.

## Mobile-first daily use

**Home** starts with four tiles for the selected display: items on the wiring diagram, items not plugged in yet, install steps checked, and things still to check. Each tile opens the matching screen. The tiles count what is recorded; they do not certify anything. The large marketing headings above each screen have been removed so every tab starts with its own content.

On an iPhone, **Home** now opens on the **whole display** instead of silently choosing just the first outlet. The oversized detailed wiring tree starts collapsed; open it only when you need the full source reference. **Install checklist** is one tap away, while **Fullscreen diagram** and **Edit wiring** remain accessible. The mobile bottom navigation is the primary way to switch Home, Diagram, Tasks and Inventory; the side menu focuses on tools, backups and less frequent actions.

On the **Wiring diagram** tab the diagram itself is the first thing on screen. One row above it switches between **Wiring**, **Property photo**, **Install steps** and **Needs checking**, a **Showing** list narrows the view to one outlet or area, and **Import / export** holds the workbook, photo-matching, Excel-reference and print actions. On a phone the same row becomes four compact tabs; tap an item to see its name and **Plug into… / Details / Photos** directly on the diagram, and use **Full screen** for more room.

In **Tasks**, selecting a work area opens its next incomplete phase and section, and the phase counters reflect that area. Empty areas say when there are no steps; tasks with an unspecified area appear under Other. **Find in checklist** opens and scrolls to the next step. Switching projects or between Install and Teardown starts a fresh view without changing saved progress. Only the next incomplete phase and work area expand initially. Use **Working in** to focus on a particular area, **Find in checklist** to jump to the next action, or open **Notes / photo** inline beneath a step rather than in a floating overlay. Every existing checkbox ID, note and picture is preserved. The workbook photo review also offers per-picture equipment search and All/Unassigned/Selected filters; all images still begin Skipped and require manual assignment.

These are responsive usability changes tested by the automated suite and build; physical iPhone/Safari interaction and installed-PWA smoke testing remain to be performed.

## Photo matching and a simpler checklist

Choose **Wiring diagram → Import / export → Match workbook photos** to open the separate, private, review-before-import workflow. Select your original **.xlsx** workbook, preview embedded JPG/PNG/WebP images, and see their original worksheet/row when available. Every image starts as **Skip**; select a specific existing component and its purpose (installed / connector / storage / detail) before importing. A single confirmation adds only selected, compressed images to existing private galleries. Review controls are temporarily disabled during extraction or import, and leaving the review cancels any pending application. Existing photos, wiring, stock, notes and checklist records are not replaced. The app does not automatically identify props from a generic image filename or screenshot. Max eight photos per component; confirm your browser can save and sync large galleries. Original workbooks stay unchanged.

The **Tasks** view has two modes: **Install** and **Teardown**. Each is now split into three clear collapsible phases and grouped into **Front porch**, **Garage & driveway**, **Backyard** and **Other** areas, with progress and a next step. Every checkmark, task note and photo uses its previous storage key, so progress made in the old flat list is preserved. Setup order is place → connect downstream first → attended test; teardown is de-energize → unplug → pack. Showing a diagram step does not verify electrical safety.

The temporary **Needs field check** badges added to every wiring node have been removed from the diagram; no stored verification record was deleted. Existing detailed verification and wiring-audit tools remain available separately.

## Wiring diagram: one way to build

The standard diagram and full-screen **Builder** now share one panel and one set of actions. There are no separate Connect, Add item, Insert on wire and Quick edit tabs any more.

1. **Add item** opens the guided form (type, area, known output count). An empty diagram offers **Add an outlet** right on the canvas.
2. **Select an item.** The panel shows the item first (icon, name, area, photos), then two plain sections:
   - **Power in** — what it is plugged into, with **Change…** and **Unplug**; or **Not plugged in yet** with **Plug into…**.
   - **Power out** — one row per recorded output. An occupied row links to the item using it. A free row has **Plug something in**.
3. **Plug something in** on a specific free output, then choose a new item type (optionally name it) or an item that is already on the diagram but not plugged in. The output is always the one you tapped; Blueprint never picks one for you. New items are added and connected in one validated step and stay unverified.
4. **Plug into…** works from the other direction: tap the power source on the diagram (or pick it in the panel), then choose its actual output. **Change…** uses the same picker for an existing feed and asks for confirmation; the affected branch returns to Draft and the old install step is cleared.
5. **Select a wire** to see both ends and whether its install step is checked, **Unplug** it, or **put something in between**: choose a cord, SPT-1, splitter, inline tap or light strand, **Preview change**, then **Confirm insertion**. The one old connection becomes two validated connections and unrelated branches are untouched.

Dragging from an output dot onto another item still records a connection on that exact output. Items show **Not plugged in** and **1 of 2 free** tags so gaps are visible without opening anything. If an item's output count is unknown, **Power out** asks for the real count before offering any output.

With nothing selected the panel is a **Wiring overview**: three-line how-to, quick add buttons, the list of items that are not plugged in yet, the collapsed **Connection overview** of recorded outputs, and the **Where does it plug in?** finder. **Find an item…** in the toolbar searches the whole project. On a wide screen the diagram fits everything only while names stay readable; a larger display opens at a legible zoom on its power sources, and you pan for the rest.

Other item actions live in the same panel: **Trace source**, **If unplugged**, **Only this path**, output names, **Duplicate**, **Photos**, **Remove**, and the collapsed **Equipment specs, storage & notes**. Switch the toolbar from **Arranged automatically** to **My own positions** to drag items or use the **Move on diagram** buttons; positions never change what is plugged into what.

You can also edit **directly over the diagram**: double-click a node (desktop), right-click it, **select and press F2**, or **tap/click its icon** to open a compact name/icon picker. **Done / Enter explicitly saves a name; Escape / close discards an unfinished name.** An icon is presentation only and never changes the hardware type, outputs or ratings.

**Duplicate** creates a new physical item: new component and asset IDs, a '(copy)' name, copied reusable descriptions, and **no** wiring, photos, verified state, output-specific port names, purchase details or completed steps. It is not the same as reusing one asset across seasons (**Add item → Use equipment from another display**).

## Undo, redo and field-check visibility

**Undo / Redo** sit in the diagram toolbar and the full-screen Builder bar and cover recent graph and photo-layout actions: adding, removing, plugging in, changing a feed, inserting, duplicating, name/icon changes made through the panel, button moves, and photo marker, route and scale changes. On desktop, Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes when a text field is not focused. History is limited to ten steps in the current browser session and is not a synced history.

A reversed power connection is validated again and its affected component field checks and obsolete connection tasks are invalidated. Unrelated checklist entries remain. **Undo never means a connection was electrically checked**. Photo-heavy plans that exceed the bounded session history limit can still be edited, but the app asks you to make a private restore point first.

If encrypted sync detects conflicting device changes, resolving the conflict initiates a private JSON backup download before replacing either version. Verify that the download was saved. Cloud choices remain deliberate, and a conflicting version is not automatically overwritten.

## Full screen: Explore or Builder

**Full screen** in the diagram toolbar opens the same diagram across the whole viewport in **Builder** (also on iOS Safari, without the native Fullscreen API). **Home → Fullscreen diagram** opens it in read-only **Explore**.

- **Explore:** read-only. Pan by dragging empty space, pinch or scroll to zoom, use **+ / − / Fit**, switch **Whole system / outlet / area**, search the entire project under **Tools**, tap an item to highlight its power path and open its photo card, or choose **Path only**. There is no dragging, connecting, deleting or icon editing.
- **Builder:** the same panel as the standard diagram, shown as a side column on a wide screen and a bottom sheet on a phone, with **Add item**, **Undo / Redo** and the arrangement choice in its bar. Tap an item or a wire and use the same Power in / Power out / wire actions described above.
- **Escape** closes the topmost thing first (name popup, add form, photo card, an unfinished plug-in), then leaves full screen. Phones open at a readable zoom near the current outlet rather than shrinking the whole system; **Fit** is there when you want the overview.

The diagram models **one documented AC power input per receiving item**, not HDMI, audio, BLE or battery-only control wiring. A recorded connection does not mean the circuit is electrically safe. **Do not invent a port name or tap connection without confirming it physically.** The original Christmas O03 morning-room C9 tap remains unspecified until checked in the field.

## Visual icons and equipment photo cards

Each component now has an **optional visual icon distinct from its functional electrical type**. The picker suggests Halloween, Christmas and component-specific art (Skelly/skeleton, scarecrow, pumpkins, roofline C9, deer, snowman, roof/wreath lights, splitters and more). A visual skull/roofline icon does **not** change its recorded power consumption, plug type or actual wiring. Existing imported items keep their previous fallback icons until explicitly changed. Edit an existing component via **Builder → Quick edit → Diagram icon and output labels** or the standard component inspector.

**Photo-backed equipment cards:** In fullscreen **Explore**, tap a component to open its read-only details: main photo, notes, storage location and the documented upstream path. In Builder or the regular item panel, open **Photos & details** to take or upload photos and choose **Installed view**, **Plug / connector**, **Storage / bin** or **Detail**. Up to **8 compressed photos per item** are supported; choose a cover image and tap to enlarge. Existing single-photo data remain visible. Photos live in private IndexedDB and the encrypted sync payload when connected, subject to browser/cloud size limits. Photos are documentation, **not** proof of electrical safety. Excel reference export still omits images; the private JSON backup includes them.

## Christmas lighting counts and strand inventory

Choose the Christmas project, then **Inventory → Lighting counts** (the default for Christmas). This is separate from the standard Equipment inventory and does not create AC power connections.

Use **Add missing sections** to create optional blank planned records for first/second floor roofline C9, covered porch, morning room, mulch-bed outlines, bush/tree minis, fence minis and porch columns. The app never invents bulb/strand counts or installation status, and repeating the action avoids duplicate default labels.

For each run or group of identical strands, record **number of strands**, **bulbs per strand**, **custom total bulbs** for irregular C9 runs, length per strand, LED/incandescent, bulb and wire colors, brand/model, storage and installation notes. Track Planned, Installed, Spare, or Needs repair separately. Summary totals show known bulb counts *and how many rows still need counting*; unknown is never treated as zero. Custom totals override multiplication.

Associate a row with an existing diagram component only as a navigation reference, not a new power connection. Download a private lighting CSV or an Excel reference workbook with a Lighting Inventory sheet. The lighting rows also use encrypted project synchronization and private JSON backups. When copying a year, installed lighting rows become planned again for verification.

## Count Christmas lights once — permanent stock and yearly assignments

**Inventory → Lighting counts** now separates physical stock from the annual display plan. Enter your real C9 bulb counts and mini-light strand counts **only when you first inventory them** (or buy/discard more). The same named stock item and storage bin are reused in Christmas 2026, 2027, and later. Changes to annual placements never create a second copy of that physical stock.

- **Owned inventory**: one row per physical C9 bulb stock lot or group of identical mini-light strings, with actual quantity, bulb count/string, color, model, condition and storage. Enter unknown values as blank; do not estimate.
- **This year's placement**: assign an existing stock item to first-floor roofline, second-floor roofline, bushes, trees, fence, etc., with a *separate* quantity and **Planned / Installed** status. Collapsed item cards summarize this year's planned/installed allocations and remaining usable spares; unknown counts stay unknown, and repair stock cannot be shown as available spare stock. The same lights can change places next year without being recounted.
- **Reuse last year's layout** copies only location assignments into the new Christmas year, explicitly setting them back to Planned. Physical stock quantities and identity do not change. Known shortage counts are shown by unit (C9 bulbs vs mini strings), with missing measurements called out.
- **Legacy counted rows:** use the explicit review/import action once in the year you originally counted the lights. Existing annual inventory rows remain untouched; importing the same physical set from multiple old years can double-count it, so check for duplicated source records before confirming.
- **Storage labels** can be printed per stock item. Private CSV exports include stock IDs and this year's placements.
- **Backups and sync:** A hidden internal shared-stock record lives within the **same local-first, encrypted project vault** and JSON backups. It never appears in the seasonal project picker or makes a new AC wiring connection. A count is not proof of installation or electrical safety.

### Local restore points and change preview

Choose **More → Restore points / history** on either phone or desktop. Save a named snapshot **before** a major rewiring change. Up to the newest eight complete snapshots per seasonal project stay in the local browser (8 MB cap each); they include existing photos. The timeline compares added, removed and changed items and connections, and each point can be downloaded as a private JSON backup. Restoring prompts for confirmation, automatically saves the current plan first, then restores the chosen wiring as **Draft** with all old installation checklist ticks and field-verification status cleared.

These restore points are **local to that device**—not synced to other devices—and are not continuous automatic history or a one-tap undo of every operation. For huge photo-filled projects or durable off-device recovery, export a private JSON backup instead. Cloud conflict handling still applies if the restoration conflicts with another linked device.

### Safer cross-device lighting edits

When both your phone and desktop are linked, independent edits to **different** lighting stock items or yearly placements can now reconcile using per-item content hashes saved on the device. If both devices change the **same** light quantity differently, or one deletes something whose history is ambiguous, Blueprint requires an explicit conflict decision. This is not instant collaborative editing, and whole-project deletions remain disabled while cloud-linked.

### Navigation and offline access

Phone navigation is now **Home / Diagram / Inventory / Tasks**. Tasks has Install and Teardown sections. Advanced operations remain in the More menu. The app also registers an installable home-screen web app shell on supported browsers. After an online visit and successful app-shell caching, the **previously loaded app shell** can reopen offline; user projects persist in IndexedDB and sync again when online. A physical iPhone offline/reopen test has not been completed; do not treat the local app as your only backup.

## Main features

| Area | What it does |
| --- | --- |
| **Field Mode** | Phone-friendly outlet selection, current setup progress, one-tap next step, readable connection tree, attached photos and equipment/storage notes, search across the full project, optional advanced diagram editor |
| **Wiring** | Graph-based outlets → cords/splitters/C9 strands → decorations; auto power-flow or saved manual layout; per-outlet focus, source tracing, and guided “Where does this plug in?” changes |
| **Install & Teardown** | Numbered generated tasks, shared checkboxes/notes/photos, downstream-first connection plan, printable outlet-specific guides |
| **Needs checking** (verification audit) | Unconnected or unverified items, unknown cord lengths/load values, optional photos/connector reminders; no fabricated ratings |
| **Inventory** | Equipment list with search, area and missing-storage filters; tap a row to record its storage spot, condition, quantity, notes and repair history in place, or jump to it on the wiring diagram. House outlets are not listed as stored equipment. CSV download. |
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
