import { CATALOG } from './catalog';
import type { CatalogItem } from './types';

export function ComponentLibrary({ collapsed, search, onSearch, onToggle, onAdd, onDragStart, onOpenTemplates }: {
  collapsed: boolean; search: string; onSearch: (value: string) => void; onToggle: () => void;
  onAdd: (item: CatalogItem) => void; onDragStart: () => void; onOpenTemplates: () => void;
}) {
  if (collapsed) return <aside className="fb-library collapsed"><button className="fb-panel-toggle" onClick={onToggle} title="Open component library">›</button></aside>;
  return <aside className="fb-library">
    <div className="fb-panel-head"><div><small>BUILD</small><h2>Components</h2></div><button className="fb-icon-btn" onClick={onToggle} title="Collapse library">‹</button></div>
    <button className="fb-template-launch" onClick={onOpenTemplates}><span>✦</span><div><b>Start from a template</b><small>Recruitment-ready layouts</small></div><i>›</i></button>
    <div className="fb-search"><span>⌕</span><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search components..." /></div>
    <div className="fb-library-scroll">
      {CATALOG.map(group => {
        const items = group.items.filter(item => `${item.name} ${item.hint}`.toLowerCase().includes(search.toLowerCase()));
        return items.length ? <section className="fb-component-group" key={group.category}><h3>{group.category}</h3><div className="fb-component-list">
          {items.map(item => <button type="button" className="fb-component" key={item.id} draggable
            onDragStart={event => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-builder-component', item.id); onDragStart(); }}
            onClick={() => onAdd(item)}>
            <span className="fb-component-icon">{item.glyph}</span><span><b>{item.name}</b><small>{item.hint}</small></span><i>⋮⋮</i>
          </button>)}
        </div></section> : null;
      })}
    </div>
  </aside>;
}
