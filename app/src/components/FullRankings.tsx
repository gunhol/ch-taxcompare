import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Map, Pin, PinOff } from 'lucide-react'
import { incomeRankingCsv } from '../lib/csv'
import { CHF, formatRate, NUMBER } from '../lib/tax'
import type { ChurchOption, Household, RankedMunicipality } from '../types/geography'

interface FullRankingsProps {
  items: RankedMunicipality[]
  sort: string
  income: number
  household: Household
  church: ChurchOption
  includeFederal: boolean
  pinnedIds: Set<number>
  onSort: (sort: string) => void
  onTogglePin: (id: number) => void
  onShowOnMap: (id: number) => void
}

const PAGE_SIZE = 50
export default function FullRankings({ items, sort, income, household, church, includeFederal, pinnedIds, onSort, onTogglePin, onShowOnMap }: FullRankingsProps) {
  const [requestedPage, setRequestedPage] = useState(0)
  const taxScope = includeFederal ? 'Federal tax included · personal tax excluded' : 'Federal and personal taxes excluded'
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount - 1)
  const visible = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function exportCsv() {
    const csv = incomeRankingCsv(items, { income, household, church, includeFederal })
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ch-taxcompare-estv-2026-income-${income}-${household}-${church}${includeFederal ? '-federal' : ''}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <section className="full-rankings content-section" aria-labelledby="full-rankings-title">
    <div className="page-title-row"><div><h1 id="full-rankings-title">All municipalities, ranked.</h1><p>Official annual income tax on {CHF.format(income)} CHF of gross income. Standard deductions included; {taxScope}.</p></div><button type="button" className="primary-button" onClick={exportCsv} disabled={!items.length}><Download size={17} />Export income tax CSV</button></div>
    <div className="full-ranking-tools"><span><b>{NUMBER.format(items.length)}</b> municipalities</span><label>Sort<select value={sort} onChange={event => onSort(event.target.value)}><option value="value-asc">Lowest tax first</option><option value="value-desc">Highest tax first</option><option value="name">Municipality name</option></select></label></div>
    <div className="full-table-wrap"><table className="full-ranking-table"><thead><tr><th>Rank</th><th>Municipality</th><th>Canton</th><th>District</th><th>BFS no.</th><th>Estimated tax (CHF)</th><th>Effective rate</th><th>Actions</th></tr></thead><tbody>{visible.map((item, index) => <tr key={item.bfsId}><td>{page * PAGE_SIZE + index + 1}</td><td><b>{item.name}</b></td><td>{item.canton}</td><td>{item.district}</td><td>{item.bfsId}</td><td><strong>{CHF.format(item.value)}</strong></td><td>{formatRate(item.effectiveRate)}</td><td><div className="table-actions"><button type="button" className="icon-button" onClick={() => onShowOnMap(item.bfsId)} aria-label={`Show ${item.name} on the map`}><Map size={16} /></button><button type="button" className="icon-button" onClick={() => onTogglePin(item.bfsId)} aria-label={`${pinnedIds.has(item.bfsId) ? 'Unpin' : 'Pin'} ${item.name}`} aria-pressed={pinnedIds.has(item.bfsId)}>{pinnedIds.has(item.bfsId) ? <PinOff size={16} /> : <Pin size={16} />}</button></div></td></tr>)}</tbody></table></div>
    <div className="pagination"><span>Page {page + 1} of {pageCount}</span><div><button type="button" className="secondary-button" disabled={page === 0} onClick={() => setRequestedPage(current => current - 1)}><ChevronLeft size={16} />Previous</button><button type="button" className="secondary-button" disabled={page >= pageCount - 1} onClick={() => setRequestedPage(current => current + 1)}>Next<ChevronRight size={16} /></button></div></div>
  </section>
}
