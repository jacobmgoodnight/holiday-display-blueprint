# Codex guidance — Holiday Display Blueprint

1. Treat wiring as an explicit directed graph with one receiving power input per non-outlet component, output ports and no cycles. Always validate before persisting changes, imports or restores. Icon layout is presentation only.
2. A "verified as-installed" tag means field documentation, **not** an electrical-safety certificate. Do not infer amperage, wire gauge, GFCI, shared breaker or capacity. Missing ratings remain flagged.
3. Never commit actual house photographs, personally identifying property maps, private inventory, real cord run notes or Excel master workbooks. Fixtures must be generic, clearly marked examples. Keep JSON backups private.
4. Do not alter `jacobmgoodnight/glowroute` or `jacobmgoodnight/pumpkin-family-organizer`. New integrations should use explicit versioned exports, not ad hoc shared state.
5. Maintain browser-only functionality on GitHub Pages. No Supabase, paid API, server or tracked secrets. Keep the Vite deployment base path intact.
6. Preserve original workbook content on import. Unknown columns go to metadata. Reject invalid edges individually and explain why; never silently change power topology.
7. Every graph, data-migration or persistence change needs regression tests. Run `npm test` and `npm run build` before a PR. Test with a fresh browser profile as well as existing IndexedDB data.
8. Prioritize phone yard workflow: big task tap targets, quick trace, legible photos, offline-tolerant core screens, browser backup reminders. Do not pretend separate devices auto-sync.
9. As-built examples from user notes must be accurately represented. For Christmas O03, the short green SPT-1 morning-room connection originates at a **female connection on the covered-porch C9 strand**, never on the upstream white feeder.
