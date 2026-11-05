import assert from 'node:assert/strict'
import test from 'node:test'
import { createShareSearch, DEFAULT_SHARE_STATE, parseShareState } from './urlState.ts'

test('uses clean defaults when the URL has no share state', () => {
  assert.deepEqual(parseShareState(''), DEFAULT_SHARE_STATE)
  assert.equal(createShareSearch(DEFAULT_SHARE_STATE), '')
})

test('round-trips income, household, church, canton, and municipality', () => {
  const state = {
    income: 150000,
    household: 'marriedDualWithChildren',
    church: 'protestant',
    canton: 'SZ',
    municipality: 1323,
  } as const
  const search = '?income=150000&household=marriedDualWithChildren&church=protestant&canton=SZ&municipality=1323'
  assert.equal(createShareSearch(state), search)
  assert.deepEqual(parseShareState(search), state)
})

test('preserves an explicitly cleared municipality selection', () => {
  const state = { ...DEFAULT_SHARE_STATE, canton: 'ZH', municipality: null }
  assert.equal(createShareSearch(state), '?canton=ZH&municipality=0')
  assert.deepEqual(parseShareState('?canton=ZH&municipality=0'), state)
})

test('treats a canton-only link as having no selected municipality', () => {
  assert.deepEqual(parseShareState('?canton=ZH'), { ...DEFAULT_SHARE_STATE, canton: 'ZH', municipality: null })
})

test('rejects unsupported or malformed URL values', () => {
  const state = parseShareState('?income=123456&household=unknown&church=other&canton=XX&municipality=-4')
  assert.deepEqual(state, DEFAULT_SHARE_STATE)
})
