# Maintaining your real Halloween and Christmas wiring

## Source-of-truth decision

**Holiday Display Blueprint is the live installation record.** Use the app to update real connections, correct cord lengths, document newly added props and add field photos. It is the only source that automatically synchronizes between devices when you have opened the private master link on each browser.

Keep the original Halloween and Christmas **master Excel workbooks as historical references**. They contain original diagrams, notes and embedded pictures that the app does not yet perfectly reconstruct. Store these originals privately. Do not treat them as interchangeable live copies of Blueprint.

The **Export Excel reference** action creates a convenient *new workbook* containing current component IDs, from/to/port connections, notes, checklists, review items and a wiring-change log. That export is a *snapshot*, not a round-trip synchronization format; edits to that file **do not update Blueprint**. Photos are excluded from the spreadsheet export; a private JSON backup includes photos.

## Reversing diagram edits and checking verification

In the standard diagram toolbar or the full-screen **Builder** bar, use **Undo / Redo** to reverse recent diagram changes; desktop keyboard shortcuts work when a text field is not focused. Undo is limited to up to ten browser-session edits, rather than a server-synced history. Major actions include add, plug in, unplug, change feed, insert, duplicate, remove, button moves and name/icon/area edits made in the item panel. Edits to equipment specs and notes, and drag moves, are not yet covered individually. An undo that would replay over another device's changed diagram is refused.

Restoring a previous physical feed returns affected components to **Draft / Needs field check**, removes obsolete link checkmarks and does **not** reinstate old completion or safety certification. Unrelated checklist notes survive. Per-node field-check badges have been removed to reduce clutter. The checkbox under Equipment specs and the **Needs checking** audit still retain optional recorded checks. A selected wire's **Install step checked** only means that checklist step was completed; it is not electrical certification.

For oversized photo-rich plans, create a private manual restore point before rewiring. The current editing action remains possible, but in-memory undo may be unavailable. Before using a cloud conflict resolution button, the app starts a private JSON backup download; confirm it was saved before leaving the page. Historical Excel workbooks are private references and have not been silently imported or photo-matched.

## Starting a new display

Select **Menu → New display** on a phone or **More actions → New display** on a computer, then enter a name, season and year. The separate draft starts empty. Add a known power source, add equipment first, or start with a property photo. The guided form lets you add cords, lights and other items repeatedly, reuse equipment, and connect an unconnected item later. Select an area and record the actual output count, or choose **Not sure yet**. An unknown count is displayed as unknown and cannot feed downstream items until updated in item details. Choose the actual source and port for any connection. No physical connection is inferred and the recorded connection still requires field review.

Choose **Draw lights** or **Draw cord**, select an area, tap at least two points on the property photo and save. This creates one unconnected item and its visual route together; it does not infer output counts, wiring or a physical length. You can undo points or use keyboard controls before saving. Unfinished routes prompt before navigation or photo replacement. Tap a marker for actions directly below the photo, drag it to move, and use **Browse equipment** for unplaced items.

After saving a drawn route, choose **Name or edit**, **Connect**, **Draw another**, or **Estimate length**. The photo planner’s **Undo / Redo** shares the bounded current-session history with the diagram. It can reverse marker moves, saved route or scale edits, and creation of an item and route together; finish or discard in-progress photo drafts first. Replacing or removing a photo clears session history. For durable recovery, use a private backup or restore point.

On the **Wiring diagram** tab, **Add item** opens the guided form; an empty diagram also offers **Add an outlet** directly on the canvas. Select any item to see its **Power in** and **Power out** in the panel. Tap **Plug something in** on the exact free output you mean, then choose a new item type or an existing item that is not plugged in yet. To work from the other end, choose **Plug into…** on an unplugged item, tap its power source on the diagram, and pick the actual output. Changing an existing feed uses **Change…** and still asks for confirmation. No output is ever chosen for you.

With nothing selected the panel shows a **Wiring overview**: the items that are not plugged in yet (each with **Plug into…**), the collapsed **Connection overview** of recorded occupied, available or unknown outputs, and the **Where does it plug in?** finder. Diagram items also carry **Not plugged in** and **1 of 2 free** tags. These report the recorded plan, not electrical capacity or field verification.

**Wiring diagram → Property photo** lets you select a type and area, then tap the photo to add and place several unconnected items. Choose **Stop adding** to select markers, or select existing equipment to place or move it. New sources retain an unknown output count until explicitly recorded. Select a light strand or cord and use **Draw route** to tap points, undo points, and save a visual route; use **Edit route points** for later corrections. Zoom and pan the photo, filter the item list and toggle marker names. **Edit details here** edits the selected item and **Place another like this** makes a separate, unconnected asset. Save drafts before leaving the planner.

Select an unconnected item and choose **Connect**. Tap a source marker or choose a source from the list, record its actual output count if unknown, and choose an available output before saving. Occupied ports and invalid sources are shown; no existing connection is silently replaced. The normal graph validation and field-review rules apply. **Preview lights & power path** can show saved connections between placed markers; its schematic lines do not represent physical cord routes. Light bulbs, spacing and decoration icons are illustrations and do not change stock or wiring.

Use **Add view** for up to eight named property photos. Each has its own photo, marker locations, routes and scale while all views share the same equipment and wiring. The original photo remains the main view. Replacing or deleting a view's image removes that image's markers and routes after confirmation. Compressed photos and their layouts are private project data, included in JSON backups and linked encrypted sync subject to storage limits, and omitted from Excel reference export.

In **Measurements & materials**, tap the endpoints of a known reference distance and enter its actual length. Route lengths derived from that scale are approximate: perspective, obstacles and slack affect the real route. Record an optional field-measured route length for comparison against known equipment lengths or explicitly linked lighting records. The app never converts estimates into physical inventory counts or electrical capacity.

## Phone navigation and fewer taps

On a phone, use the four bottom tabs to move between Home, Diagram, Tasks and Inventory. The menu is for import/export/backup and less frequent tools. Home defaults to the whole system instead of an arbitrary first outlet. Choose O01/O02/O03 only when focusing on one circuit. The detailed wiring guide is collapsed until requested, and Install checklist opens Tasks directly.

On the Wiring diagram tab, a phone shows four compact view tabs (**Wiring**, **Property photo**, **Install steps**, **Needs checking**), a **Showing** list for one outlet or area, and the diagram with **Add item**, undo/redo, **Full screen** and **Find an item…**. Tap an item to see its name with **Plug into…** (if it has no source), **Details** and **Photos**; Details jumps to the same item panel beneath the diagram. **Full screen → Builder** shows that panel as a bottom sheet over a larger diagram.

On Tasks, the next incomplete phase and area are expanded first. Select **Working in** to narrow the list, use **Find in checklist** to locate the next unchecked action, and expand **Notes / photo** directly below its step. Existing completion and reference images persist. In workbook photo review, search component names/IDs per image and filter by unassigned or selected. All images are skipped by default.

## Workbook image review and phased tasks

**Wiring diagram → Import / export → Match workbook photos** opens the separate photo review screen. Select a local .xlsx workbook and review each embedded image, its original worksheet/anchor row where supported, and the equipment record to attach it to. The default for every image is **Skip**. Choose the component and photo purpose; only approved selections are compressed and appended to private galleries. No workbook images or filenames are published to GitHub, and no electrical links are created. Existing photos remain, capped at eight per component. Diagrams/screenshots without a meaningful component match should remain skipped.

**Install/Teardown** now uses three expandable phases and groups checkboxes by display area. Choosing an area opens its next unfinished section and shows area-specific phase counts; an empty area is identified as such. Steps without a recognized area remain accessible under Other. **Find in checklist** opens and scrolls to the next step; changing projects or modes resets the view, not the saved checkmarks. Old task IDs, notes and attached photos are reused; finished tasks are not reset. Install: position, connect downstream first, then attend final power-on tests. Teardown: power off, unplug, then pack and document storage. Look at the next unchecked step or filter by area; use **Diagram** to see the real recorded connection. The separate field-verification audit remains available, but distracting new node-level check badges were removed.

## Photos and stock-change records

Permanent lighting stock now supports an optional private reference photo (e.g. C9 socket detail, storage bin, mini-light packaging) uploaded through the phone camera. The compressed photo travels with the stock item across Christmas years and syncs within private vault size limits. Use **Owned inventory → select stock → Add stock photo**. When the physical owned bulb or strand count changes, Blueprint keeps a short dated quantity-change log so next year's purchases are distinguishable from merely reassigning the same strands.

## Permanent light counts across years

**Count your lights once.** Inventory → Lighting counts now includes **Owned inventory** for physical C9 bulb stock and mini-light string groups, plus **This year's placement** for locations and quantities. Enter bulb/strand counts only upon first inventory or physical purchase/disposal/repair. Reuse last year's locations as Planned for a new season without recounting stock.

The app uses a hidden private catalog inside the encrypted project vault, not new AC circuit nodes. Old per-year inventory rows remain available until you explicitly choose to import them into shared stock. Review possible duplicate physical items before importing old years. Never use a prior-year installation checkbox as proof of the new year's installation.

This year's placement quantities can exceed recorded stock only as a **known shortage**; unknown owned quantities must remain unknown. Each stock row summarizes this year's planned and installed allocations, usable spare stock and known minimum shortages. An uncounted placement makes its spare count unknown; repair stock is never presented as usable spare stock. C9 bulbs and mini-light strings are separate units and cannot be added into a single total. Print storage labels with the permanent stock ID rather than a year-specific string number.

## Counting Christmas C9 bulbs and mini-light strands

Open **Inventory → Lighting counts** in your Christmas project. Lighting inventory describes physical strings/runs and never changes the separate electrical wiring diagram.

- **Add missing Christmas sections** optionally creates blank planned entries for documented first-floor/second-floor C9s, covered-porch and morning-room C9s, both mulch beds, bushes, yard trees, fence and porch columns. No lengths, bulbs, ratings, status or ports are assumed.
- For C9 custom runs, enter an actual bulb total per named physical run, and add another row if a floor uses multiple runs.
- For identical mini-light strings, record e.g. three 100-bulb strings as one row; use separate rows where the type, bulb count, color or brand differs.
- Track installed and planned runs separately from spare/repair stock; log LED/incandescent, bulb color, wire color, model, storage bin and notes as confirmed.
- Optional diagram component links are for lookup only, never a new AC power feed.
- Totals retain explicit unknown quantities, and exports contain only entered counts. Historical Excel workbook originals are not modified.

## One panel for every wiring change

The standard diagram and full-screen **Builder** use the same panel. Selecting an item always puts that item first: icon, **editable name**, area and photos. Below that:

- **Power in** — the item it is plugged into and the exact output, with **Change…** and **Unplug**; or **Not plugged in yet** with **Plug into…**. An outlet is a power source and has no input.
- **Power out** — one row for each recorded physical output. An occupied row names the item using it (tap to jump there). A free row offers **Plug something in**. If the output count is unknown, the panel asks you to count the real sockets first and offers nothing until you do.
- **Trace source**, **If unplugged** and **Only this path** for reading the circuit.
- **Output names** to label real sockets (e.g. Kasa left, C9 female tap). Names are descriptive and never move or rewire anything.
- **Duplicate**, **Photos**, **Remove**, and the collapsed **Equipment specs, storage & notes**.
- **Move on diagram** buttons when the arrangement is **My own positions**. Moving an item never changes what is plugged into what.

**Plug something in** (from a free output row): choose **Something new** and a type — extension cord, splitter, smart plug, lights, decoration, spotlight or another type — with an optional name, or **Already on the diagram** to pick an item that has no source yet. The item is added and connected in one validated step, on the output you tapped, and stays unverified. Outlets are never offered because an outlet cannot receive power.

**Plug into… / Change…** (from the item that receives power): tap the source on the diagram or choose it from the list, then choose its output. Occupied outputs are shown and disabled; sources that would create a loop, have no outputs or have an unknown output count explain why they are unavailable. A change to an existing feed asks for confirmation, replaces the old source rather than adding a second one, returns the affected branch and the project to **Draft**, and clears the old connection's install step.

**Select a wire** to see its two ends, the output it uses and whether its install step is checked. From there:

- **Unplug** removes that one recorded feed after confirmation.
- **Put something in between:** choose a cord, SPT-1, splitter, inline tap or light strand and an optional name, **Preview change** to see the exact before and after, then **Confirm insertion**. The old connection is replaced by two new ones in a single validated change, its install step is reset, the new item and everything downstream need checking again, and unrelated branches and saved positions are untouched.

On desktop, **double-click**, **right-click**, or select a node and press **F2** to rename it over the canvas; click the node icon to choose an icon. On a phone, tap the node icon. **Done / Enter** commits a name; **Escape / close** discards it. Choosing an icon never changes the component kind, wiring, source port or ratings. Cosmetic name and icon edits leave field status alone; changing electrical specifications still requires re-verification.

**Duplicate** makes a separate **Draft** component with a new ID and asset identity, a '(copy)' name, the same icon and reusable notes. It does **not** copy wiring, source-specific port names, photos, purchase history or completed/verified state, and it stays unplugged until you record a real free output. A duplicated outlet does not mean another physical outlet exists. Do not confuse it with *Use equipment from another display* in the Add item form, which deliberately links one physical asset across plans.

**Do not imply exact port numbers or physically installed locations when they are not field confirmed.** If the actual output is unknown, add the item unplugged and leave that gap visible.

## Full screen: Explore and Builder

**Full screen** in the diagram toolbar opens the diagram across the whole viewport in **Builder**. **Home → Fullscreen diagram** opens read-only **Explore**; switch between the two at the top.

- **Explore** disables dragging, connecting, deleting and icon editing. Drag empty space to pan, pinch or scroll to zoom, use the ± / **Fit** buttons, switch the outlet or area, search the whole project under **Tools**, and tap an item to trace its upstream feed and open its photo card. **Path only** isolates that chain.
- **Builder** shows the same panel described above as a side column on a wide screen and a bottom sheet on a phone. Its bar has **Add item**, **Undo / Redo** and the arrangement choice. Everything acts on your existing project and encrypted sync; there is no second diagram.
- **Escape** closes the topmost thing first (name popup, Add item form, photo card, an unfinished plug-in) and then leaves full screen.

**iPhone usability:** Full screen opens at a legible zoom near the current outlet, not the whole tiny circuit. Use **Fit** for the overview and pinch to zoom. The top bar is compact, and search and Path only live behind **Tools**. Browser chrome controlled by iOS is outside the app.

**Icons and photo cards:** the icon picker suggests seasonal art (Skelly, pumpkins, C9 roofline, reindeer, snowman, splitters and more); it is presentation only. In Explore, tap a node for its equipment card, cover photo, storage and notes. When editing, open **Photos** from the panel to take or upload installed, plug close-up, storage or detail photos: one cover plus additional labeled images, up to eight compressed photos per component. Photos stay in the private backup and sync, never the public repository, and large collections can reach cloud upload limits.

## Practical phone installation: Field Mode

Open your **private linked master plan** on your phone, then choose **Field** on the bottom navigation (it opens by default on narrow phones). Pick O01/O02/O03 or Whole system.

- The main card shows the next unfinished setup step with a single **Mark step complete** button. These are the same persisted checklist tasks visible on desktop.
- Search by name, wiring ID or storage notes **across the entire project**, even when looking at one outlet. Search results show the documented source chain and can jump to the advanced wiring diagram.
- Below the next step, expand the connection tree to inspect branches and splitter outputs, reference photos, equipment notes, and checklist boxes.
- Tap **Edit wiring** only when you actually need to change the graph; the simpler phone view does not alter electrical topology.
- Local saves are queued separately for each project. Leaving an active project or switching seasons no longer cancels its pending write. The app reports saving/saved/failed, with a retry action. Cloud sync remains independent and periodic while the app is open.

Do not use an unknown or provisional Excel note to invent a power socket in the app.

## Confirming a field installation

Changing the project status to **Verified as-installed** now requests a written review. If the model reports outstanding wiring or field-check findings, document your observed evidence and outstanding exceptions. A date, note and recorded exceptions are retained in the project. Invalid graphs cannot be verified. **This status never certifies electrical safety.**

Deleting a component now invalidates surviving downstream verification and removes obsolete connection/setup checkmarks, with an immediate guarded **Undo component removal** action. Old completed/verified state is not automatically restored. Cloud-linked whole-project deletion stays disabled until safe deletion synchronization is implemented.

## Changing a connection during installation

1. Open the **private Blueprint master link** on the device you plan to use. Check that the **Private sync on** indicator appears. If sync is offline, your work still saves locally; confirm it syncs again before editing on another device.
2. Select the real seasonal master project in the project picker, not a starter example.
3. Choose **Wiring diagram**, and use **Showing** to focus on O01/O02/O03 if the display is large. The automatic arrangement is the easiest view for most changes.
4. Use **Find an item…** to locate the item and select it. Under **Power in** choose **Change…** (or **Plug into…** if it has no source), tap the upstream outlet, smart plug, extension cord, splitter, C9 strand or SPT-1 feeder on the diagram, then choose the correct output. Outputs already in use are marked.
5. Choose **Change connection** and confirm. The old source is replaced (not duplicated); affected items and the project are marked **Draft** for field re-verification, and the old connection checklist completion is cleared.
6. Fill in cord length, color, construction, output count, ratings, and where it is stored. Attach a photo of the actual cord label or nearby wiring if helpful.
7. Verify the physical connection in the yard **while de-energized**, then mark individual components as field-verified. Only change the overall project status to **Verified as-installed** after inspecting the entire installation. That label is documentation, **not** an electrical safety certificate.
8. Return to **Install steps**. Printed outlet guides are available via **Print this view**.

**Example:** If an extra carved pumpkin has moved to a new porch splitter output, change its *recorded upstream source and output number* in Blueprint. Do not edit only the visual icon position; moving a node does not change the actual graph. The 2026 Halloween four-carved-pumpkin wiring needs this kind of reconciliation against the latest field notes.

## Christmas 2026 source clarification

The short green SPT-1 to the morning-room C9 roofline **plugs into a female connection on a covered-porch C9 strand**, not into the white SPT-1 feeder. The identity of the exact strand/tap has not been verified. Leave that uncertainty explicit rather than choosing a port by assumption.

## Working from an updated Excel master

- **Do not repeatedly import an edited original workbook into the current synced master.** The importer creates a separate draft or adds records. It does not perform a safe Excel-to-live-master merge.
- If a workbook has newer facts, compare it with the live Blueprint project one component/connection at a time, update the live graph, and retain the workbook as evidence.
- Use the new Excel reference export to archive the state at a milestone (Halloween installed, Christmas installed, after teardown, or end of season). Optionally store it alongside the old workbook in your private OneDrive archive.
- Use **Back up all projects (JSON)** before large edits or conflicting-device resolution. A backup contains private inventory/photos and should not be publicly shared.

## What still needs manual checks

Blueprint models **documented AC power wiring**, not electrical certification. It does not know your actual breaker sharing, outdoor cord condition, weatherproof fittings, extension cord load limits, GFCI operation, rated wattages, or the manufacturer ratings of every connection. BLE control, projector HDMI/audio links and battery power should not be inserted as AC power links.

## Suggested improvements

- **One-click circuit change review**: show wiring differences since last installation, including disconnected feeds and field verification evidence.
- **Clear picture-to-component association**: extract photos from the old workbooks and attach them to exact equipment records, with unmatched photos explicitly identified.
- **More legible mobile diagrams**: Field Mode now provides an outlet-first mobile view with steps and photos; improve port names and photo association next. collapse complex power branches, pre-label plugs/splitter port names, make setup photos and cord lengths directly visible.
- **Project-wide completeness checks**: distinguish missing confirmed upstream sources, missing cord lengths, unknown load estimates, and unverified branch connectors.
- **Trusted offline experience**: installable PWA with cached assets, safe backup reminders and offline-sync status; currently the browser may not open the app offline unless its assets remain cached.
- **Stronger cloud conflict resolution**: show side-by-side differences rather than a whole-project keep-cloud/keep-device choice.
- **Source reconciliation**: explicit review wizard for Excel workbook revisions rather than generating disconnected duplicate draft projects.
