# Roadmap

## Shipped in MVP

- Multiple seasons/years, draft vs as-installed, copy-to-next-year.
- Typed nodes/ports, validated edge graph, editable React Flow wiring maps, zones/outlet views, path tracing and outage impact.
- Graph-generated setup/teardown, saved completion and notes, reference photos, private browser IndexedDB, JSON backups, inventory CSV.
- XLSX sheet inspection, column mapping, import dry-run feedback and unknown-field preservation.
- CI for tests/build, GitHub Pages deploy, README and Codex policy.

## Next: field-ready v0.2

1. **Workbook conversion profile** for the actual Halloween master and Christmas wiring sheets: merged-cell heuristics, explicit workbook-specific adapter and full cross-sheet mapping review, after testing privately against supplied files. Keep adapters free of household content in the public repo.
2. **Workbook image/media anchoring**: map embedded images to components, report orphaned drawings, support independent PNG/photo import.
3. **Better installation plans**: editable phases and dependency overrides, per-task photos, inspection checkpoints, special teardown instructions; prohibit source energization until all downstream work is ready.
4. **Full-system print/export**: deterministic fit-to-page multi-page schematic, per-zone sheets, high-resolution PDF vector output and labels.
5. **Inventory across years**: stable catalog item IDs separate from instance IDs, reorder quantity, repairs, cost summary, photo/bin finder, search all seasons and condition history.
6. **Stronger electrical model**: explicit male/female connector compatibility, inline taps, circuit groups, port names/ratings, known/unknown watts, manual load ledger and warnings only (never automatic safe certification).
7. **Mobile offline readiness**: PWA install, cached static assets and reliability tests on iOS Safari; quick camera capture and field task photos.
8. **House plan overlay**: background opacity/registration, independent named floor/zone layouts, move-on-map mode without affecting the wiring graph.
9. **Changes between years**: graph diff, equipment movement, visual status legend, verified field evidence and structured change log.

## Future app integration (do not embed now)

- **Holiday Show Control:** expose a versioned read-only JSON catalog of component IDs and physical controllers. Separate live-control layer; never make automation energize unfamiliar wiring.
- **Projection Studio:** external linking of projector component IDs to projection playlists/profiles, no actual video editing in this app.
- **Home inventory:** use a versioned shared equipment schema for asset IDs, location, condition and repair events; keep individual seasonal placement records separate.

## Known MVP limitations

- Package dependencies could not be fetched in the initial build environment, so **local installation/build verification remains pending** until running `npm install && npm test && npm run build` in a network-enabled environment or GitHub Actions.
- The workbook importer is a controlled row/column mapper, **not automatic reverse-engineering** of irregular Excel/shape-based wiring diagrams; embedded images not extracted.
- Only generic connectors / port counts are validated. Male/female polarity and electrical load safety remain future tasks.
- IndexedDB is per browser/device. Browser storage may be cleared; there is no autosync, authentication or conflict resolution.
- Photos are stored inline as compressed data URIs in the local project record. A large library could exceed browser storage quotas; separate blob storage would scale better.
- The print view uses the browser print engine; large diagrams may need manual scale adjustments.

## Master workbook import (2026-10-29)
- [x] Detect the structured Halloween and narrative Christmas source worksheets.
- [x] Preserve Halloween ID/port/source-row metadata, cord tags and unknown or excluded links.
- [x] Stage new draft projects rather than replacing current plans.
- [x] Private offline backup of the two 2026 master projects; never publish private source data.
- [ ] Map anchored workbook pictures onto equipment records and inspect unmatched images.
- [ ] Review/merge source revisions and show exact year-to-year diffs.
- [ ] Trace unresolved Christmas prose notes to field-verified connector locations.
