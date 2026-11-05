import { incomeTaxValue } from './income.ts'
import type { ChurchOption, Household, IncomeProfileDataset, MunicipalityFeature, RankedMunicipality } from '../types/geography'

export const NUMBER = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 })
export const CHF = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 })
const RATE = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const HOUSEHOLDS: { id: Household; label: string }[] = [
  { id: 'single', label: 'Single, no children' },
  { id: 'singleWithChildren', label: 'Single, two children' },
  { id: 'marriedSingleNoChildren', label: 'Married, one earner, no children' },
  { id: 'marriedSingleWithChildren', label: 'Married, one earner, two children' },
  { id: 'marriedDualNoChildren', label: 'Married, 50/50 earners, no children' },
  { id: 'marriedDualWithChildren', label: 'Married, 50/50 earners, two children' },
]

export const CHURCHES: { id: ChurchOption; label: string }[] = [
  { id: 'none', label: 'No church tax' },
  { id: 'protestant', label: 'Protestant' },
  { id: 'romanCatholic', label: 'Roman Catholic' },
  { id: 'christianCatholic', label: 'Christian Catholic' },
]

export { incomeTaxValue }

export function formatRate(value: number): string {
  return `${RATE.format(value)}%`
}

export function buildRanking(features: MunicipalityFeature[], profile: IncomeProfileDataset, income: number): RankedMunicipality[] {
  const ranking: RankedMunicipality[] = []
  for (const feature of features) {
    if (feature.properties.special) continue
    if (!profile.rates[String(feature.properties.bfsId)]) continue
    const calculation = incomeTaxValue(profile, feature.properties.bfsId, income)
    ranking.push({ ...feature.properties, ...calculation, feature })
  }
  return ranking
}

export function quantileBreaks(ranking: RankedMunicipality[]): number[] {
  const values = ranking.map(item => item.value).sort((a, b) => a - b)
  return Array.from({ length: 6 }, (_, index) => {
    const position = Math.min(values.length - 1, Math.floor((index / 5) * (values.length - 1)))
    return values[position] ?? 0
  })
}

export function colorIndex(value: number, breaks: number[]): number {
  for (let index = 1; index < breaks.length; index += 1) {
    if (value <= breaks[index]) return Math.max(0, index - 1)
  }
  return 4
}

export function sortRanking(items: RankedMunicipality[], sort: string): RankedMunicipality[] {
  return [...items].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'de-CH')
    if (sort === 'value-desc') return b.value - a.value || a.name.localeCompare(b.name)
    return a.value - b.value || a.name.localeCompare(b.name)
  })
}
