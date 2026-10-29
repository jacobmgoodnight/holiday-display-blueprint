import type {Component, Connection, Position} from './model';

/**
 * A deterministic, read-only layout of a power-connection forest. Coordinates
 * are visual only: this function never writes to Component.position or edges.
 * Outlets appear first; siblings follow source-port order.
 */
export function powerFlowLayout(nodes: readonly Component[], edges: readonly Connection[]): Map<string, Position> {
  const known = new Map(nodes.map(n => [n.id, n]));
  const children = new Map<string, Connection[]>();
  const hasParent = new Set<string>();
  for (const edge of edges) {
    if (!known.has(edge.source) || !known.has(edge.target) || edge.source === edge.target) continue;
    const list = children.get(edge.source) ?? [];
    list.push(edge);
    children.set(edge.source, list);
    hasParent.add(edge.target);
  }
  const byName = (a: Component, b: Component) =>
    (a.kind === 'outlet' ? 0 : 1) - (b.kind === 'outlet' ? 0 : 1) ||
    a.name.localeCompare(b.name, undefined, {numeric: true}) ||
    a.id.localeCompare(b.id);
  for (const list of children.values()) list.sort((a, b) =>
    a.sourcePort - b.sourcePort || byName(known.get(a.target)!, known.get(b.target)!));
  const roots = nodes.filter(n => !hasParent.has(n.id)).sort(byName);
  const positions = new Map<string, Position>();
  const visiting = new Set<string>();
  const column = 280;
  const row = 115;
  let nextRow = 35;
  function place(id: string, depth: number): number {
    if (positions.has(id)) return positions.get(id)!.y;
    // Imported data should be validated, but still avoid infinite recursion.
    if (visiting.has(id)) return nextRow;
    visiting.add(id);
    const childY = (children.get(id) ?? [])
      .filter(edge => !visiting.has(edge.target))
      .map(edge => place(edge.target, depth + 1));
    const y = childY.length ? (childY[0] + childY[childY.length - 1]) / 2 : nextRow;
    if (!childY.length) nextRow += row;
    visiting.delete(id);
    positions.set(id, {x: 35 + depth * column, y});
    return y;
  }
  for (const root of roots) {
    if (!positions.has(root.id)) {
      place(root.id, 0);
      nextRow += 55; // clear break between independent outlet circuits
    }
  }
  for (const node of [...nodes].sort(byName)) {
    if (!positions.has(node.id)) {
      place(node.id, 0); // cycle/malformed-import fallback
      nextRow += 55;
    }
  }
  return positions;
}
