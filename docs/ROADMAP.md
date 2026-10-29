# Roadmap — Holiday Display Blueprint

_Last reviewed: October 29, 2026. "Shipped" means code merged/deployed and CI-tested, **not** field-verified installation._

## Shipped and testable

- **Multi-season local-first records:** Halloween/Christmas years, graphs with directed feeds, output ports, validation, asset details, notes, reference photos, verified/draft states, IndexedDB and JSON backups. Per-project serialized writes, local saved/saving/failed indicators, retries, and safe flush during project switches.
- **Master references:** private two-season initial master snapshot distributed through the encrypted GitHub Pages recovery file; source-aware Halloween structured-sheet and Christmas narrative-sheet import (new drafts, no auto merge).
- **Mobile header navigation:** a clearly labeled single menu drawer with setup views and quick import/export/backup/sync actions; the desktop three-dot More actions dropdown remains distinct, with outside-tap and Escape dismissal.
- **Navigable wiring:** left-to-right auto power-flow layout, preserved manual placements, quick O01/O02/O03 focus, searchable source paths, isolate selected branch, outage impact.
- **Installer experience:** a first-class phone **Field Mode** (outlet selection, next incomplete step, project-wide search, storage/photo references) plus collapsible power trees, shared setup checkboxes, and printable outlet sheets.
- **Phone access:** private URL-fragment key; browser decrypts master snapshot once and links the device to the encrypted cloud sync vault; no app account required.
- **Encrypted sync:** Supabase encrypted vault with no direct anon/authenticated table grants, local encryption/decryption, periodic polling/online/focus retries, per-project hashes, server compare-and-swap conflicts; works while browsers are open.
- **Needs Verification dashboard:** outlet/full-system filters, missing power-path and graph checks, per-device field verification, unknown cord lengths and load estimates, and optional photo/connector/rating reminders. Includes search and jump-to-item; these are documentation checks only.
- **Safe component deletion and immediate undo:** confirms removal, removes obsolete wire/setup tasks, invalidates downstream verified state, and offers guarded restore of deleted node and valid incident links. Old completion/verification does not return.
- **Dated as-installed review:** manual review notes and explicit unresolved findings, with graph validation; not an electrical inspection.
- **Safe last-feed reversal:** reverse only the most recent guided power-connection change when the current feed still matches its recorded postcondition. Reverts remain draft with old checklist progress unverified; no full graph undo or cloud-history replay.
- **Documenting changes:** guided **Where does this plug in?** source/port editor, recorded recent feed history, field verification invalidation after changes.
- **Excel snapshot export:** current components, power links, setup/teardown steps, review flags, wiring history; read-only reference workbook, not a two-way edit or import.
- **Automated tests and deployment:** Vitest and TypeScript production build run before GitHub Pages deploy.

## Highest-priority next improvements

1. **Safer source reconciliation (large impact).** Match a changed workbook's IDs against the current synced master, present a side-by-side diff of additions, removals and upstream/port changes, require explicit per-change approval, and avoid overwriting field photos/checklist states.
2. **Deeper field evidence.** The Needs Verification dashboard now flags missing recorded feeds, cord lengths, load details, optional photos and component field-verification state. Next: require connector-specific field photos/inspection notes for uncertain C9 taps and splitter ports, plus date/inspector provenance.
3. **Full project undo + deeper history.** The first version supports safe node removal/undo and guarded feed reversal. Remaining: The latest guided power-feed change can now be safely reversed, without re-verification. Next: undo component deletions, historical graph snapshots, cloud-aware conflict handling and "what changed since last installation?" reports; log all topology edits consistently.
4. **Image association.** Reconcile privately uploaded workbook-embedded photos/drawings with the matching component ID; show unmatched photos for manual assignment. No public household images.
5. **More reliable shared editing.** Local per-project IndexedDB writes are now serialized, but cloud behavior still needs per-item/per-checkbox comparisons, correctly propagate intentional project deletions (tombstones); add end-to-end browser/device integration tests.
6. **PWA offline launch.** Cache the app shell/assets for true offline use, test iOS Safari install/offline editing, and show last successful cloud sync per device.
7. **Port labels and circuit sheets.** Allow meaningful output names ("Kasa left", "S04 port 3", "C9 female tap"), hide unrelated splitter branches, and export more readable multi-page vector diagrams with connector labels.
8. **Cross-season asset IDs.** Stable shared physical-equipment registry with repair history, inventory bin, reusable cord length and new-year installation differences.
9. **Power-load ledger (not certification).** Record trusted manufacturer watts/amperage, outdoor rating and GFCI inspection evidence; flag unknown/suspect values without making safety claims.

## Known limitations to communicate

- **Not two-way Excel sync.** Import creates separate drafts/records; exported workbooks are private *reference snapshots*. The original master Excel files preserve photos and diagrams but should not become competing live records.
- **Photo media** lives as compressed data URIs inside project backups; large photos may exceed browser storage or the encrypted vault upload cap. Excel export intentionally omits images.
- **Sync** is periodic while open, not instant multiuser collaborative editing; offline changes retry when the browser returns. Conflicts may require a manual whole-project choice. Project deletion currently needs design/reconciliation before claiming cross-device deletion sync.
- **Field Mode** is a focused phone companion, not a separate source of truth. Checklist edits share the same project and cloud sync. Browser-level iOS/Android usability tests remain outstanding.
- **Offline launch** is not guaranteed after clearing browser cache; IndexedDB may be cleared by the user/device.
- **Print** relies on the browser print dialog, with no calibrated engineering schematic or certified plan generation.
- **Source-import limits:** HTML/Excel shapes and anchored images aren't automatically mapped; the Christmas workbook lacks stable IDs for all connector-level links.
- **Electrical safety:** No measurement of real current, breaker sharing, safe load, cord damage or GFCI operation. Project "verified" means field documented only.

## Private 2026 plan reconciliation still needed

- **Halloween O01**: verify that the imported master represents the later four carved pumpkins with C7 flicker bulbs, the added brown 3-way-end extension, short black run and Skull Stack move.
- **Halloween O02/O03**: confirm the current outlet-to-prop branches, fog tote changes and exact cord length/port labels.
- **Christmas O03**: morning-room feeder connects at a female on a **covered-porch C9 strand**. Do not guess which strand or its port yet.
- **Christmas O01/O02**: field-verify the planned roof C9 feeder, yard figures, beds and fence minis before upgrading project status.

## Future integrations (not automatic yet)

- **Holiday Show Control:** versioned read-only equipment catalog / IDs, no unsafe automatic energization.
- **Projection Studio:** reference projector media profiles by stable equipment IDs, keep video production in that app.
- **Home inventory:** optional shared asset IDs and repair records without silently sharing whole private property diagrams.
