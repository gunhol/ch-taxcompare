import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { CHURCHES, HOUSEHOLDS, NUMBER } from '../lib/tax'
import { INCOME_BRACKETS } from '../lib/income'
import type { CantonFeature, ChurchOption, Household, MunicipalityFeature } from '../types/geography'

interface FilterBarProps {
  income: number
  household: Household
  church: ChurchOption
  canton: string
  query: string
  cantons: CantonFeature[]
  municipalities: MunicipalityFeature[]
  resultCount: number
  onIncome: (value: number) => void
  onHousehold: (value: Household) => void
  onChurch: (value: ChurchOption) => void
  onCanton: (value: string) => void
  onQuery: (value: string) => void
  onSelectPlace: (feature: MunicipalityFeature) => void
  onClearSearch: () => void
}

export default function FilterBar(props: FilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const suggestions = useMemo(() => {
    const query = props.query.trim().toLocaleLowerCase('de-CH')
    if (!query) return []
    return props.municipalities
      .filter(feature => !feature.properties.special)
      .filter(feature => feature.properties.name.toLocaleLowerCase('de-CH').includes(query) || String(feature.properties.bfsId).startsWith(query))
      .sort((a, b) => {
        const aStarts = a.properties.name.toLocaleLowerCase('de-CH').startsWith(query) ? 0 : 1
        const bStarts = b.properties.name.toLocaleLowerCase('de-CH').startsWith(query) ? 0 : 1
        return aStarts - bStarts || a.properties.name.localeCompare(b.properties.name, 'de-CH')
      })
      .slice(0, 8)
  }, [props.municipalities, props.query])

  function choose(feature: MunicipalityFeature) {
    props.onSelectPlace(feature)
    props.onQuery(feature.properties.name)
    setSearchOpen(false)
    searchRef.current?.focus()
  }

  return (
    <section className="filter-bar" aria-label="Comparison filters">
      <div className="filter-field income-field">
        <label htmlFor="income-filter">Gross income, CHF</label>
        <div className="income-input-wrap"><select id="income-filter" value={props.income} onChange={event => props.onIncome(Number(event.target.value))}>{INCOME_BRACKETS.map(value => <option key={value} value={value}>{NUMBER.format(value)}</option>)}</select><span>CHF</span></div>
        <input className="income-range" type="range" min="0" max={INCOME_BRACKETS.length - 1} step="1" value={INCOME_BRACKETS.indexOf(props.income)} onChange={event => props.onIncome(INCOME_BRACKETS[Number(event.target.value)])} aria-label="Gross income slider" aria-valuetext={`${NUMBER.format(props.income)} CHF`} style={{ '--range-progress': `${INCOME_BRACKETS.indexOf(props.income) / (INCOME_BRACKETS.length - 1) * 100}%` } as React.CSSProperties} />
      </div>
      <div className="filter-field household-field">
        <label htmlFor="household-filter">Household</label>
        <div className="select-wrap"><select id="household-filter" value={props.household} onChange={event => props.onHousehold(event.target.value as Household)}>{HOUSEHOLDS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div>
      </div>
      <div className="filter-field church-field">
        <label htmlFor="church-filter">Church tax</label>
        <div className="select-wrap"><select id="church-filter" value={props.church} onChange={event => props.onChurch(event.target.value as ChurchOption)}>{CHURCHES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div>
      </div>
      <div className="filter-field canton-field">
        <label htmlFor="canton-filter">Canton</label>
        <div className="select-wrap"><select id="canton-filter" value={props.canton} onChange={event => props.onCanton(event.target.value)}><option value="">All 26 cantons</option>{props.cantons.map(item => <option key={item.properties.abbr} value={item.properties.abbr}>{item.properties.name}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div>
      </div>
      <div className="filter-field search-field" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false) }}>
        <label htmlFor="place-search">Find a municipality or BFS no.</label>
        <div className="search-control"><Search size={16} aria-hidden="true" /><input
          ref={searchRef}
          id="place-search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={searchOpen && suggestions.length > 0}
          aria-controls="place-suggestions"
          aria-activedescendant={searchOpen && suggestions[highlighted] ? `place-option-${suggestions[highlighted].properties.bfsId}` : undefined}
          placeholder="e.g. Zug or 1711"
          value={props.query}
          onFocus={() => setSearchOpen(true)}
          onChange={event => { props.onQuery(event.target.value); setHighlighted(0); setSearchOpen(true) }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setSearchOpen(true); setHighlighted(current => Math.min(suggestions.length - 1, current + 1)) }
            if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted(current => Math.max(0, current - 1)) }
            if (event.key === 'Enter' && searchOpen && suggestions[highlighted]) { event.preventDefault(); choose(suggestions[highlighted]) }
            if (event.key === 'Escape') { setSearchOpen(false); searchRef.current?.blur() }
          }}
        />{props.query && <button type="button" className="clear-search" onClick={() => { props.onQuery(''); props.onClearSearch(); searchRef.current?.focus() }} aria-label="Clear municipality search"><X size={15} /></button>}</div>
        {searchOpen && props.query.trim() && (
          <div className="search-results" id="place-suggestions" role="listbox">
            {suggestions.length ? suggestions.map((feature, index) => <button
              type="button"
              role="option"
              id={`place-option-${feature.properties.bfsId}`}
              aria-selected={index === highlighted}
              key={feature.properties.bfsId}
              className={index === highlighted ? 'is-highlighted' : ''}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => choose(feature)}
            ><span><b>{feature.properties.name}</b><small>{feature.properties.district}</small></span><em>{feature.properties.canton} · {feature.properties.bfsId}</em></button>) : <p>No municipality matches “{props.query}”.</p>}
          </div>
        )}
      </div>
      <div className="coverage-count"><b>{NUMBER.format(props.resultCount)}</b><span>municipalities in view</span></div>
    </section>
  )
}
