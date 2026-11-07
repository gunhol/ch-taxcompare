import assert from 'node:assert/strict'
import test from 'node:test'
import { incomeRankingCsv } from './csv.ts'
import type { RankedMunicipality } from '../types/geography.ts'

function rankedMunicipality(includeFederal: boolean): RankedMunicipality {
  const total = includeFederal ? 1700 : 1500
  return {
    bfsId: 1,
    name: 'Test "North"',
    canton: 'ZH',
    cantonName: 'Zürich',
    cantonNumber: 1,
    district: 'Test',
    special: false,
    value: total,
    total,
    cantonTax: 1000,
    communeTax: 500,
    churchTax: 0,
    federalTax: 200,
    effectiveRate: total / 1000,
    feature: {} as RankedMunicipality['feature'],
  }
}

const localOptions = { income: 100000, household: 'single', church: 'none', includeFederal: false } as const
const federalOptions = { ...localOptions, includeFederal: true }

test('exports local tax components without a federal column and records the disabled scope', () => {
  const local = incomeRankingCsv([rankedMunicipality(false)], localOptions)
  assert.equal(local.includes('federal_tax_chf'), false)
  assert.match(local, /church_option,include_federal,cantonal_tax_chf/)
  assert.match(local, /total_income_tax_chf/)
  assert.match(local, /1000\.00,500\.00,0\.00,1500\.00/)
  assert.match(local, /,single,none,false,1000\.00/)
  assert.match(local, /"Test ""North"""/)
})

test('exports official federal tax and the selected total and records the enabled scope', () => {
  const federal = incomeRankingCsv([rankedMunicipality(true)], federalOptions)
  assert.match(federal, /church_option,include_federal,cantonal_tax_chf/)
  assert.match(federal, /church_tax_chf,federal_tax_chf,total_income_tax_chf/)
  assert.match(federal, /1000\.00,500\.00,0\.00,200\.00,1700\.00/)
  assert.match(federal, /,single,none,true,1000\.00/)
  assert.match(federal, /"Test ""North"""/)
})
