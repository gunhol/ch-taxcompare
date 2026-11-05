import { ArrowLeft, Database, ExternalLink, MapPinned } from 'lucide-react'

export default function MethodView({ onBack }: { onBack: () => void }) {
  return <article className="method-view content-section">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={17} />Back to comparison</button>
    <h1>Real geography. Official 2026 income tax data.</h1>
    <p className="method-lead">Compare official cantonal, communal and church income tax profiles for every Swiss municipality by gross income and household type.</p>
    <div className="method-layout"><div className="method-copy">
      <section><h2>What the map shows</h2><p>The map renders the actual 2026 administrative geometry: 2,110 political municipalities plus three special areas, with separate canton outlines and lakes. Municipality names, BFS identifiers, districts and canton membership come from the official Swiss commune directory.</p><p>The three special areas remain visible for geographic completeness but are excluded from rankings, pinning and exports because the ESTV data has no municipality records for them.</p></section>
      <section><h2>How the profiles are calculated</h2><p>The Federal Tax Administration calculates each profile from gross income using its official 2026 tariffs, standard deductions, household rules and local tax multipliers. The app stores those official results directly instead of recreating cantonal formulas.</p><p>Six models cover single people and married couples, with no children or two children. Married models offer one earner or equal 50/50 earnings. Each model supports no church tax, Protestant, Roman Catholic or Christian Catholic church tax.</p></section>
      <section><h2>Scope and limitations</h2><p>Select gross income before deductions. The totals include annual cantonal, communal and selected church income tax, with official standard deductions already represented. Federal direct tax and personal taxes are excluded.</p><p>The profiles do not model individual deductions, wealth tax, corporate taxes, credits or every personal circumstance. Values are official model results, not a personalised tax assessment or tax advice. Every profile contains 27 official income brackets and all 2,110 political municipalities.</p></section>
    </div><aside className="source-panel">
      <Database size={24} aria-hidden="true" /><h2>Sources and provenance</h2>
      <a href="https://swisstaxcalculator.estv.admin.ch/#/taxdata/tax-scales" target="_blank" rel="noreferrer">ESTV 2026 tax calculator<ExternalLink size={14} /></a>
      <p>Official gross-income household profiles, including tariffs, standard deductions and local calculations.</p>
      <a href="https://swisstaxcalculator.estv.admin.ch/#/taxdata/tax-rates" target="_blank" rel="noreferrer">ESTV 2026 municipality tax data<ExternalLink size={14} /></a>
      <p>Federal Tax Administration data covering all 2,110 municipalities.</p>
      <a href="https://github.com/interactivethings/swiss-maps" target="_blank" rel="noreferrer">Swiss Maps geometry pipeline<ExternalLink size={14} /></a>
      <p>2026 TopoJSON derived from Swisstopo administrative boundaries, packaged by Interactive Things.</p>
      <a href="https://www.agvchapp.bfs.admin.ch/de/communes/query" target="_blank" rel="noreferrer">Official commune directory<ExternalLink size={14} /></a>
      <p>Federal Statistical Office directory, queried at the 1 January 2026 municipal status.</p>
      <a href={`${import.meta.env.BASE_URL}data/metadata.json`} download>Download dataset metadata<Database size={14} /></a>
      <div className="static-note"><MapPinned size={18} /><p>All runtime data is served as local static assets. No account, tracking service, server API or database is used.</p></div>
    </aside></div>
  </article>
}
