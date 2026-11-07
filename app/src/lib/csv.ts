import type { ChurchOption, Household, RankedMunicipality } from '../types/geography'

export interface CsvOptions {
  income: number
  household: Household
  church: ChurchOption
  includeFederal: boolean
}

function escape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export function incomeRankingCsv(items: RankedMunicipality[], options: CsvOptions): string {
  const { income, household, church, includeFederal } = options
  const header = [
    'bfs_id,municipality,canton,district,tax_year,gross_income_chf,household,church_option,include_federal,cantonal_tax_chf,communal_tax_chf,church_tax_chf',
    includeFederal ? 'federal_tax_chf' : '',
    'total_income_tax_chf,effective_rate_percent',
  ].filter(Boolean).join(',')
  const rows = items.map(item => [
    item.bfsId,
    escape(item.name),
    item.canton,
    escape(item.district),
    2026,
    income,
    household,
    church,
    includeFederal,
    item.cantonTax.toFixed(2),
    item.communeTax.toFixed(2),
    item.churchTax.toFixed(2),
    ...(includeFederal ? [item.federalTax.toFixed(2)] : []),
    item.total.toFixed(2),
    item.effectiveRate.toFixed(6),
  ].join(','))
  return [header, ...rows].join('\n')
}
