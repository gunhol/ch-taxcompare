import { Pin, X } from 'lucide-react'
import { CHF } from '../lib/tax'
import type { RankedMunicipality } from '../types/geography'

interface PinnedComparisonProps {
  items: RankedMunicipality[]
  onRemove: (id: number) => void
  onClear: () => void
  onSelect: (id: number) => void
}

export default function PinnedComparison({ items, onRemove, onClear, onSelect }: PinnedComparisonProps) {
  const difference = items.length >= 2 ? Math.abs(items[0].value - items[1].value) : null
  return (
    <section className="pinned-section" id="pinned-comparison" aria-labelledby="pinned-title">
      <div className="section-heading"><div><h2 id="pinned-title">Pinned comparison</h2><p>Keep up to four municipalities in view while you change the tax selection.</p></div>{items.length > 0 && <button type="button" className="text-button" onClick={onClear}>Clear all</button>}</div>
      {!items.length ? <div className="pinned-empty"><Pin size={22} aria-hidden="true" /><div><b>No places pinned yet.</b><p>Use any pin button in the ranking, or select a map polygon and choose “Pin to compare”.</p></div></div> : <>
        <div className="pinned-grid">{items.map(item => <article key={item.bfsId} className="pinned-place">
          <button type="button" className="remove-pin" onClick={() => onRemove(item.bfsId)} aria-label={`Remove ${item.name} from comparison`}><X size={16} /></button>
          <button type="button" className="pinned-place-name" onClick={() => onSelect(item.bfsId)}>{item.name}<span>{item.canton} · BFS {item.bfsId}</span></button>
          <strong>{CHF.format(item.value)} <span>CHF</span></strong><small>Estimated annual income tax</small>
        </article>)}</div>
        <div className="comparison-summary" aria-live="polite"><b>{difference === null ? 'Pin one more place to see a difference.' : `${items[0].name} ↔ ${items[1].name}: ${CHF.format(difference)} CHF apart.`}</b><span>Official 2026 ESTV household profiles include standard deductions. Federal and personal taxes are excluded.</span></div>
      </>}
    </section>
  )
}
