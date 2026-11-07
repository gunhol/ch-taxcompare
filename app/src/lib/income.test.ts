import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { incomeTaxValue, profileFilename } from './income.ts'
import type { Household, IncomeProfileDataset } from '../types/geography.ts'

const profile = JSON.parse(readFileSync(new URL('../../public/data/income-profiles/single-none.json', import.meta.url), 'utf8')) as IncomeProfileDataset

test('uses the official Bister gross-income components at CHF 100,000', () => {
  const local = incomeTaxValue(profile, 6172, 100000)
  assert.equal(local.cantonTax, 6301)
  assert.equal(local.communeTax, 5664)
  assert.equal(local.churchTax, 0)
  assert.equal(local.federalTax, 1701)
  assert.equal(local.total, 11965)
  assert.equal(local.value, 11965)
  assert.equal(local.effectiveRate, 11.965)

  const federal = incomeTaxValue(profile, 6172, 100000, true)
  assert.equal(federal.cantonTax, 6301)
  assert.equal(federal.communeTax, 5664)
  assert.equal(federal.churchTax, 0)
  assert.equal(federal.federalTax, 1701)
  assert.equal(federal.total, 13666)
  assert.equal(federal.value, 13666)
  assert.equal(federal.effectiveRate, 13.666)
})

test('maps all six household models to their official profile filenames', () => {
  const households: Household[] = [
    'single',
    'singleWithChildren',
    'marriedSingleNoChildren',
    'marriedSingleWithChildren',
    'marriedDualNoChildren',
    'marriedDualWithChildren',
  ]
  assert.deepEqual(households.map(household => profileFilename(household, 'none')), [
    'single-none.json',
    'singleWithChildren-none.json',
    'marriedSingleNoChildren-none.json',
    'marriedSingleWithChildren-none.json',
    'marriedDualNoChildren-none.json',
    'marriedDualWithChildren-none.json',
  ])
})

test('rejects unknown municipalities and unsupported incomes', () => {
  assert.throws(() => incomeTaxValue(profile, 999999, 100000), /BFS 999999/)
  assert.throws(() => incomeTaxValue(profile, 6172, 123456), /CHF 123456/)
})
