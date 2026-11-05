import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRanking, CHF, formatRate } from './tax.ts'
import type { IncomeProfileDataset, MunicipalityFeature } from '../types/geography.ts'

const profile: IncomeProfileDataset = {
  year: 2026,
  household: 'single',
  church: 'none',
  incomes: [100000],
  rates: { '1': [[1000, 500, 0]] },
}
const municipality = { properties: { bfsId: 1, name: 'Test', canton: 'ZZ', cantonName: 'Test', cantonNumber: 1, district: 'Test', special: false } } as MunicipalityFeature
const special = { properties: { ...municipality.properties, bfsId: 2, special: true } } as MunicipalityFeature

test('ranks official profile totals and excludes special areas', () => {
  const ranking = buildRanking([municipality, special], profile, 100000)
  assert.equal(ranking.length, 1)
  assert.equal(ranking[0].value, 1500)
  assert.equal(ranking[0].effectiveRate, 1.5)
})

test('formats CHF amounts and effective rates for the interface', () => {
  assert.equal(CHF.format(12345.6), "12'346")
  assert.equal(formatRate(12.345), '12.35%')
})
