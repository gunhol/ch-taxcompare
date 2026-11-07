import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRanking, CHF, formatRate, sortRanking } from './tax.ts'
import type { IncomeProfileDataset, MunicipalityFeature } from '../types/geography.ts'

const profile: IncomeProfileDataset = {
  year: 2026,
  household: 'single',
  church: 'none',
  incomes: [100000],
  rates: { '1': [[1000, 500, 0, 200]] },
}
const municipality = { properties: { bfsId: 1, name: 'Test', canton: 'ZZ', cantonName: 'Test', cantonNumber: 1, district: 'Test', special: false } } as MunicipalityFeature
const special = { properties: { ...municipality.properties, bfsId: 2, special: true } } as MunicipalityFeature

test('ranks official profile totals and excludes special areas', () => {
  const ranking = buildRanking([municipality, special], profile, 100000)
  assert.equal(ranking.length, 1)
  assert.equal(ranking[0].value, 1500)
  assert.equal(ranking[0].effectiveRate, 1.5)

  const federal = buildRanking([municipality, special], profile, 100000, true)
  assert.equal(federal.length, 1)
  assert.equal(federal[0].federalTax, 200)
  assert.equal(federal[0].value, 1700)
  assert.equal(federal[0].effectiveRate, 1.7)
})

test('federal inclusion changes the ascending ranking order', () => {
  const orderProfile: IncomeProfileDataset = {
    ...profile,
    rates: { '1': [[1000, 0, 0, 400]], '2': [[1100, 0, 0, 0]] },
  }
  const secondMunicipality = {
    properties: { ...municipality.properties, bfsId: 2, name: 'Test 2' },
  } as MunicipalityFeature
  const municipalities = [municipality, secondMunicipality]

  const local = sortRanking(buildRanking(municipalities, orderProfile, 100000), 'value-asc')
  assert.deepEqual(local.map(item => item.bfsId), [1, 2])

  const federal = sortRanking(buildRanking(municipalities, orderProfile, 100000, true), 'value-asc')
  assert.deepEqual(federal.map(item => item.bfsId), [2, 1])
})

test('formats CHF amounts and effective rates for the interface', () => {
  assert.equal(CHF.format(12345.6), "12'346")
  assert.equal(formatRate(12.345), '12.35%')
})
