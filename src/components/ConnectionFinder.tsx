import {useMemo, useState} from 'react';
import {Search, Route, PlugZap} from 'lucide-react';
import type {Project} from '../lib/model';
import {sourcePath} from '../lib/graph';

type Props = {
  project: Project;
  scope: Set<string>;
  selected: string | null;
  onSelect: (id: string) => void;
};

export function ConnectionFinder({project, scope, selected, onSelect}: Props) {
  const [query, setQuery] = useState('');
  const [allComponents, setAllComponents] = useState(false);
  const entries = useMemo(() => {
    const outgoing = new Set(project.edges.map(e => e.source));
    const needle = query.trim().toLocaleLowerCase();
    return project.nodes
      .filter(n => scope.has(n.id))
      .map(n => {
        const path = sourcePath(n.id, project);
        const source = path[0]?.kind === 'outlet' ? path[0] : undefined;
        return {node: n, path, source};
      })
      .filter(({node, path}) => (allComponents || !outgoing.has(node.id)) &&
        (!needle || [node.name, node.id, node.zone, ...path.map(c => c.name)].join(' ').toLocaleLowerCase().includes(needle)))
      .sort((a, b) =>
        (a.source?.name || 'zzz').localeCompare(b.source?.name || 'zzz', undefined, {numeric: true}) ||
        a.node.name.localeCompare(b.node.name, undefined, {numeric: true}));
  }, [project, scope, query, allComponents]);
  return <section id="connection-finder" className="connection-finder" aria-label="Connection finder">
    <div className="finder-heading">
      <strong><Route size={16}/> Where does it plug in?</strong>
      <span>{entries.length} items</span>
    </div>
    <label className="finder-search">
      <Search size={16}/>
      <span className="visually-hidden">Find a component or connection</span>
      <input aria-label="Find a decoration, cord, or outlet" value={query}
        onChange={e => setQuery(e.target.value)} placeholder="Find a decoration or cord…"/>
    </label>
    <label className="finder-toggle">
      <input type="checkbox" checked={allComponents} onChange={e => setAllComponents(e.target.checked)}/>
      Include cords, splitters, and outlets
    </label>
    <div className="finder-results" role="list" aria-label="Connection paths">
      {entries.map(({node, path, source}) => {
        const chain = path.map(p => p.name).join(' → ');
        return <div role="listitem" key={node.id}>
          <button className={`finder-result ${selected === node.id ? 'active' : ''}`}
            onClick={() => onSelect(node.id)} aria-label={`Show power path for ${node.name}`}
            title={chain}>
            <span className="finder-result-top"><strong>{node.name}</strong>
              <small>{source ? source.name : <><PlugZap size={12}/> No confirmed outlet path</>}</small>
            </span>
            <span className="finder-chain">{source ? chain : `No confirmed power source · ${chain}`}</span>
          </button>
        </div>;
      })}
      {!entries.length && <p className="finder-empty">No matching equipment in this view. Try a different circuit or clear the search.</p>}
    </div>
  </section>;
}
