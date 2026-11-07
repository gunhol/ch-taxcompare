import { ArrowDown, ArrowUpDown, Pin, PinOff } from 'lucide-react'
import { CHF, formatRate } from '../lib/tax'
import type { RankedMunicipality } from '../types/geography'

interface RankingPanelProps {
  items: RankedMunicipality[]
  sort: string
  activeId: number | null
  hoveredId: number | null
  activeItem: RankedMunicipality | null
  includeFederal: boolean
  pinnedIds: Set<number>
  onSort: (sort: string) => void
  onSelect: (id: number) => void
  onHover: (id: number | null) => void
  onTogglePin: (id: number) => void
}

export default function RankingPanel({ items, sort, activeId, hoveredId, activeItem, includeFederal, pinnedIds, onSort, onSelect, onHover, onTogglePin }: RankingPanelProps) {
  return (
    <aside className="ranking-panel" aria-label="Municipality ranking">
      <div className="ranking-heading"><div><h2>Municipality ranking</h2><p>{items.length} places · ESTV 2026</p></div><ArrowDown size={18} aria-hidden="true" /></div>
      <div className="ranking-sort"><label htmlFor="ranking-sort">Sort ranking</label><div><ArrowUpDown size={14} aria-hidden="true" /><select id="ranking-sort" value={sort} onChange={event => onSort(event.target.value)}><option value="value-asc">Lowest tax first</option><option value="value-desc">Highest tax first</option><option value="name">Municipality name</option></select></div></div>
      <div className="ranking-table-wrap">
        <table className="ranking-table"><thead><tr><th>Rank</th><th>Municipality</th><th><span className="visually-hidden">Estimated annual income tax in </span>CHF</th><th><span className="visually-hidden">Pin</span></th></tr></thead><tbody>
          {items.slice(0, 12).map((item, index) => <tr
            key={item.bfsId}
            className={`${item.bfsId === activeId ? 'is-active' : ''} ${item.bfsId === hoveredId ? 'is-hovered' : ''} ${pinnedIds.has(item.bfsId) ? 'is-pinned' : ''}`}
            onMouseEnter={() => onHover(item.bfsId)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(item.bfsId)}
          ><td>{String(index + 1).padStart(2, '0')}</td><td><button type="button" className="place-link" onClick={() => onSelect(item.bfsId)}>{item.name}<small>{item.canton} · {item.district}</small></button></td><td>{CHF.format(item.value)}</td><td><button type="button" className="pin-button" aria-label={`${pinnedIds.has(item.bfsId) ? 'Unpin' : 'Pin'} ${item.name}`} aria-pressed={pinnedIds.has(item.bfsId)} onClick={event => { event.stopPropagation(); onTogglePin(item.bfsId) }}>{pinnedIds.has(item.bfsId) ? <PinOff size={15} /> : <Pin size={15} />}</button></td></tr>)}
        </tbody></table>
        {!items.length && <div className="ranking-empty"><b>No municipalities in this view.</b><p>Choose another canton to restore the ranking.</p></div>}
      </div>
      {activeItem ? <div className="active-place" aria-live="polite">
        <div className="active-place-top"><span>Selected municipality</span><b>{activeItem.canton}</b></div>
        <h3>{activeItem.name}</h3><p>BFS {activeItem.bfsId} · {activeItem.district}</p>
        <div className="active-place-value"><span>Estimated annual income tax<strong>{CHF.format(activeItem.value)} <small>CHF</small></strong><em>{formatRate(activeItem.effectiveRate)} of gross income</em></span><button type="button" className={pinnedIds.has(activeItem.bfsId) ? 'secondary-button is-pinned' : 'secondary-button'} onClick={() => onTogglePin(activeItem.bfsId)}>{pinnedIds.has(activeItem.bfsId) ? <PinOff size={16} /> : <Pin size={16} />}{pinnedIds.has(activeItem.bfsId) ? 'Remove pin' : 'Pin to compare'}</button></div>
        <dl className={includeFederal ? 'tax-breakdown includes-federal' : 'tax-breakdown'}><div><dt>Cantonal</dt><dd>{CHF.format(activeItem.cantonTax)}</dd></div><div><dt>Communal</dt><dd>{CHF.format(activeItem.communeTax)}</dd></div><div><dt>Church</dt><dd>{CHF.format(activeItem.churchTax)}</dd></div>{includeFederal && <div><dt>Federal</dt><dd>{CHF.format(activeItem.federalTax)}</dd></div>}</dl>
      </div> : <div className="active-place is-empty"><h3>Select a place</h3><p>Click a polygon or ranking row. Hovering either side highlights the same real municipality.</p></div>}
    </aside>
  )
}
