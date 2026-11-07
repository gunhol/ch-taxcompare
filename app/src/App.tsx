import { useEffect, useMemo, useRef, useState } from 'react'
import { Database, Info, X } from 'lucide-react'
import SwissMap from './components/SwissMap'
import FilterBar from './components/FilterBar'
import RankingPanel from './components/RankingPanel'
import PinnedComparison from './components/PinnedComparison'
import FullRankings from './components/FullRankings'
import MethodView from './components/MethodView'
import { useGeography } from './hooks/useGeography'
import { useIncomeProfile } from './hooks/useIncomeProfile'
import { buildRanking, CHF, HOUSEHOLDS, quantileBreaks, sortRanking } from './lib/tax'
import { createShareSearch, parseShareState } from './lib/urlState'
import type { ChurchOption, Household, RankedMunicipality, ViewName } from './types/geography'
import './App.css'

const DEFAULT_PINS = [1711, 1323]

export default function App() {
  const [initialShare] = useState(() => parseShareState(window.location.search))
  const firstUrlSync = useRef(true)
  const { data, error, loading, retry } = useGeography()
  const [view, setView] = useState<ViewName>('compare')
  const [income, setIncome] = useState(initialShare.income)
  const [household, setHousehold] = useState<Household>(initialShare.household)
  const [church, setChurch] = useState<ChurchOption>(initialShare.church)
  const [includeFederal, setIncludeFederal] = useState(initialShare.includeFederal)
  const [canton, setCanton] = useState(initialShare.canton)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('value-asc')
  const [activeId, setActiveId] = useState<number | null>(initialShare.municipality)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [pinnedIds, setPinnedIds] = useState<number[]>(DEFAULT_PINS)
  const [notice, setNotice] = useState('')
  const { profile, error: profileError, loading: profileLoading, retry: retryProfile } = useIncomeProfile(household, church)
  const activeFeature = data?.municipalities.find(item => item.properties.bfsId === activeId) ?? null
  const selectedFeature = activeFeature && (!canton || activeFeature.properties.canton === canton) ? activeFeature : null
  const resolvedActiveId = selectedFeature?.properties.bfsId ?? null
  const searchQuery = query || selectedFeature?.properties.name || ''

  useEffect(() => {
    function restoreShareState() {
      const state = parseShareState(window.location.search)
      setIncome(state.income)
      setHousehold(state.household)
      setChurch(state.church)
      setIncludeFederal(state.includeFederal)
      setCanton(state.canton)
      setActiveId(state.municipality)
      setQuery('')
    }
    window.addEventListener('popstate', restoreShareState)
    return () => window.removeEventListener('popstate', restoreShareState)
  }, [])

  useEffect(() => {
    const search = createShareSearch({ income, household, church, includeFederal, canton, municipality: resolvedActiveId })
    if (search === window.location.search) {
      firstUrlSync.current = false
      return
    }
    const method = firstUrlSync.current ? 'replaceState' : 'pushState'
    window.history[method](null, '', `${window.location.pathname}${search}${window.location.hash}`)
    firstUrlSync.current = false
  }, [canton, church, household, includeFederal, income, resolvedActiveId])

  const ranking = useMemo(() => data && profile ? buildRanking(data.municipalities, profile, income, includeFederal) : [], [data, includeFederal, income, profile])
  const values = useMemo(() => new Map(ranking.map(item => [item.bfsId, item.value])), [ranking])
  const breaks = useMemo(() => quantileBreaks(ranking), [ranking])
  const filtered = useMemo(() => ranking.filter(item => !canton || item.canton === canton), [ranking, canton])
  const sorted = useMemo(() => sortRanking(filtered, sort), [filtered, sort])
  const rankingById = useMemo(() => new Map(ranking.map(item => [item.bfsId, item])), [ranking])
  const pinnedItems = useMemo(() => pinnedIds.map(id => rankingById.get(id)).filter(Boolean) as RankedMunicipality[], [pinnedIds, rankingById])
  const activeItem = resolvedActiveId ? rankingById.get(resolvedActiveId) ?? null : null
  const householdLabel = HOUSEHOLDS.find(item => item.id === household)?.label ?? 'Single, no children'
  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds])
  const taxScope = includeFederal
    ? 'Federal tax included · personal tax excluded'
    : 'Federal and personal taxes excluded'

  function navigate(next: ViewName) {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function selectPlace(id: number, showMap = false) {
    const feature = data?.municipalities.find(item => item.properties.bfsId === id)
    if (!feature) return
    if (canton && feature.properties.canton !== canton) setCanton('')
    setActiveId(id)
    setQuery(feature.properties.name)
    if (showMap) navigate('compare')
  }

  function togglePin(id: number) {
    if (pinnedIds.includes(id)) {
      setPinnedIds(current => current.filter(item => item !== id))
      setNotice('')
      return
    }
    if (pinnedIds.length >= 4) {
      setNotice('Four places are already pinned. Remove one before adding another.')
      return
    }
    setPinnedIds(current => [...current, id])
    setNotice('')
  }

  if (loading || (!profile && profileLoading)) return <div className="app-loading"><div className="loading-mark"><Database size={25} /></div><h1>Loading Swiss geography and official income tax data</h1><p>Preparing 2,113 local boundaries and the selected ESTV 2026 household profile…</p></div>
  if (error || !data) return <div className="app-loading"><Info size={30} /><h1>The comparison data could not be loaded</h1><p>{error}</p><button type="button" className="primary-button" onClick={() => void retry()}>Retry local data</button></div>
  if (profileError || !profile) return <div className="app-loading"><Info size={30} /><h1>The official income profile could not be loaded</h1><p>{profileError}</p><button type="button" className="primary-button" onClick={() => void retryProfile()}>Retry official profile</button></div>

  return <div className="app-shell">
    <header className="app-header">
      <button type="button" className="brand" onClick={() => navigate('compare')} aria-label="CH Tax Compare home">ch-taxcompare<span>/observatory</span></button>
      <nav className="main-nav" aria-label="Main navigation">
        <button type="button" className={view === 'compare' ? 'is-current' : ''} aria-current={view === 'compare' ? 'page' : undefined} onClick={() => navigate('compare')}>Compare</button>
        <button type="button" className={view === 'rankings' ? 'is-current' : ''} aria-current={view === 'rankings' ? 'page' : undefined} onClick={() => navigate('rankings')}>Rankings</button>
        <button type="button" className={view === 'method' ? 'is-current' : ''} aria-current={view === 'method' ? 'page' : undefined} onClick={() => navigate('method')}>Method & sources</button>
      </nav>
      <button type="button" className="demo-status" onClick={() => navigate('method')} title="Read the income tax method and sources"><i />ESTV 2026 · INCOME TAX</button>
    </header>

    {view !== 'method' && <FilterBar
      income={income} household={household} church={church} includeFederal={includeFederal} canton={canton} query={searchQuery}
      cantons={data.cantons} municipalities={data.municipalities} resultCount={filtered.length}
      onIncome={setIncome} onHousehold={setHousehold} onChurch={setChurch} onIncludeFederal={setIncludeFederal}
      onCanton={value => { setCanton(value); setActiveId(null); setQuery('') }}
      onQuery={setQuery} onSelectPlace={feature => selectPlace(feature.properties.bfsId)}
      onClearSearch={() => setActiveId(null)}
    />}
    {notice && <div className="app-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></div>}

    {view === 'compare' && <main>
      <div className="workspace">
        <section className="map-panel" aria-labelledby="map-title">
          <div className="map-heading"><div><h1 id="map-title">Income tax by municipality</h1><p>{canton || 'Switzerland'} · {CHF.format(income)} CHF gross · {householdLabel}</p></div><button type="button" className="demo-badge" onClick={() => navigate('method')}>ESTV 2026<Info size={13} /></button></div>
          <SwissMap key={canton || 'all'} geography={data} values={values} breaks={breaks} selectedCanton={canton} activeId={resolvedActiveId} hoveredId={hoveredId} pinnedIds={pinnedSet} onHover={setHoveredId} onSelect={id => selectPlace(id)} />
          <div className="map-caption"><span>Cantonal, communal and selected church tax · standard deductions included · {taxScope}</span><b>{canton ? `${filtered.length} municipalities in ${canton}` : '2,110 municipalities + 3 special areas'}</b></div>
        </section>
        <RankingPanel items={sorted} sort={sort} activeId={resolvedActiveId} hoveredId={hoveredId} activeItem={activeItem} includeFederal={includeFederal} pinnedIds={pinnedSet} onSort={setSort} onSelect={id => selectPlace(id)} onHover={setHoveredId} onTogglePin={togglePin} />
      </div>
      <PinnedComparison items={pinnedItems} includeFederal={includeFederal} onRemove={togglePin} onClear={() => setPinnedIds([])} onSelect={id => selectPlace(id)} />
    </main>}
    {view === 'rankings' && <main><FullRankings items={sorted} sort={sort} income={income} household={household} church={church} includeFederal={includeFederal} pinnedIds={pinnedSet} onSort={setSort} onTogglePin={togglePin} onShowOnMap={id => selectPlace(id, true)} /></main>}
    {view === 'method' && <main><MethodView includeFederal={includeFederal} onBack={() => navigate('compare')} /></main>}

    <footer className="app-footer"><span>Official ESTV 2026 household profiles · standard deductions included · {taxScope}</span><button type="button" onClick={() => navigate('method')}>ESTV profiles · Swisstopo-derived geometry · BFS names · 2026</button></footer>
  </div>
}
