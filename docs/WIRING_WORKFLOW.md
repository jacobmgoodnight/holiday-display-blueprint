# Maintaining your real Halloween and Christmas wiring

## Source-of-truth decision

**Holiday Display Blueprint is the live installation record.** Use the app to update real connections, correct cord lengths, document newly added props and add field photos. It is the only source that automatically synchronizes between devices when you have opened the private master link on each browser.

Keep the original Halloween and Christmas **master Excel workbooks as historical references**. They contain original diagrams, notes and embedded pictures that the app does not yet perfectly reconstruct. Store these originals privately. Do not treat them as interchangeable live copies of Blueprint.

The **Export Excel reference** action creates a convenient *new workbook* containing current component IDs, from/to/port connections, notes, checklists, review items and a wiring-change log. That export is a *snapshot*, not a round-trip synchronization format; edits to that file **do not update Blueprint**. Photos are excluded from the spreadsheet export; a private JSON backup includes photos.

## Editing port labels and inserting components (Builder)

- **Name a socket:** open Fullscreen → Builder → **Port names**, select the source on the diagram, enter a concise name for each port, then leave the field to save. These are descriptive names on the existing numeric output slots and don't relocate or rewire any device. Regular component details also has an expandable Output names section.
- **Insert a splitter into a known existing wire:** choose Fullscreen → Builder → **Insert on wire**. Tap the wire or pick its precise source/output → receiver entry. Choose a new feeder/splitter type and an optional name. **Preview** displays the old path and proposed two-step path. Only **Confirm insertion** changes the graph.
- The operation replaces the old edge with two new link IDs, resets the old link completion checkbox, marks the new item and downstream equipment unverified, and keeps unrelated branches and manual positions intact. The insertion is performed as one validated change, not two partly completed mutations.
- The named output can refer to a known physical female receptacle, smart-plug side, inline tap or splitter socket. **Do not imply exact port numbers or physically installed locations when not field confirmed.**

**iPhone usability:** Fullscreen defaults to a legible view near the current outlet, not the whole tiny circuit. Use **Fit** for overview; pinch to zoom. The top bar is compact and search/Path-only options live behind **Tools**. The persistent tip bubble is hidden on phones; landscape gets smaller toolbars. Chrome controlled by the ChatGPT/Safari browser isn't removable by Blueprint.

## Fullscreen wiring exploration and safe building

Use **Field → Fullscreen diagram** on a phone, or **Wiring → Fullscreen** on a desktop. The first mode is **Explore**, which disables dragging and connecting nodes: drag empty space to pan; scroll/pinch or use the small ±/Fit buttons to zoom; switch the outlet filter; search any component across the full project; tap a component to trace its upstream feed; use Path only to isolate that chain. The **Exit** control returns to normal Blueprint.

To modify the graph intentionally, select **Builder**. Add a named equipment item with the mini palette, tap an upstream source and **Connect from selected**, choose a free numbered output, then tap the receiver. The guided connection editor validates cycles, occupied ports, connector compatibility, and one-input rules, and changes the affected branch back to Draft for physical re-verification. Disconnect and Remove item are deliberate actions. Existing safe Undo component removal still works.

Switch Builder's layout to **Move items manually** if you want to drag saved icon positions. Auto flow is a separate calculated view, not a permanent coordinate rewrite. Explorer and Builder operate on your existing project and encrypted phone/desktop sync; no second diagram data is created.

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
3. Choose **Wiring diagram → O01/O02/O03 → Diagram editor**. The auto power-flow layout is the easiest view for most changes.
4. Use **Find** to locate the item, then select it. In **Where does this plug in?** choose an existing upstream outlet, smart plug, extension cord, splitter, C9 strand, or SPT-1 feeder, then choose the correct numbered output. Ports already in use are marked.
5. Save the connection. For an existing power feed, confirm the change. The old source is replaced (not duplicated); affected items and the project are marked **Draft** for field re-verification, and the old connection checklist completion is cleared.
6. Fill in cord length, color, construction, output count, ratings, and where it is stored. Attach a photo of the actual cord label or nearby wiring if helpful.
7. Verify the physical connection in the yard **while de-energized**, then mark individual components as field-verified. Only change the overall project status to **Verified as-installed** after inspecting the entire installation. That label is documentation, **not** an electrical safety certificate.
8. Return to **Simplified install view** or **Installation steps**. Printed outlet guides are available via **Print this view**.

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
