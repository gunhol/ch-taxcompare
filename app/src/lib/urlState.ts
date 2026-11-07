import { INCOME_BRACKETS } from './income.ts'
import type { ChurchOption, Household } from '../types/geography'

export interface ShareState {
  income: number
  household: Household
  church: ChurchOption
  includeFederal: boolean
  canton: string
  municipality: number | null
}

export const DEFAULT_SHARE_STATE: ShareState = {
  income: 100000,
  household: 'single',
  church: 'none',
  includeFederal: false,
  canton: '',
  municipality: 1711,
}

const HOUSEHOLDS = new Set<Household>([
  'single',
  'singleWithChildren',
  'marriedSingleNoChildren',
  'marriedSingleWithChildren',
  'marriedDualNoChildren',
  'marriedDualWithChildren',
])
const CHURCHES = new Set<ChurchOption>(['none', 'protestant', 'romanCatholic', 'christianCatholic'])
const CANTONS = new Set(['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'])

export function parseShareState(search: string): ShareState {
  const params = new URLSearchParams(search)
  const income = Number(params.get('income'))
  const household = params.get('household') as Household
  const church = params.get('church') as ChurchOption
  const canton = params.get('canton') ?? ''
  const validCanton = CANTONS.has(canton) ? canton : ''
  const municipality = Number(params.get('municipality'))
  return {
    income: INCOME_BRACKETS.includes(income) ? income : DEFAULT_SHARE_STATE.income,
    household: HOUSEHOLDS.has(household) ? household : DEFAULT_SHARE_STATE.household,
    church: CHURCHES.has(church) ? church : DEFAULT_SHARE_STATE.church,
    includeFederal: params.get('federal') === '1',
    canton: validCanton,
    municipality: (municipality === 0 && params.has('municipality')) || (validCanton && !params.has('municipality'))
      ? null
      : Number.isInteger(municipality) && municipality > 0 ? municipality : DEFAULT_SHARE_STATE.municipality,
  }
}

export function createShareSearch(state: ShareState): string {
  const params = new URLSearchParams()
  if (state.income !== DEFAULT_SHARE_STATE.income) params.set('income', String(state.income))
  if (state.household !== DEFAULT_SHARE_STATE.household) params.set('household', state.household)
  if (state.church !== DEFAULT_SHARE_STATE.church) params.set('church', state.church)
  if (state.includeFederal) params.set('federal', '1')
  if (state.canton) params.set('canton', state.canton)
  if (state.municipality !== DEFAULT_SHARE_STATE.municipality) params.set('municipality', String(state.municipality ?? 0))
  const search = params.toString()
  return search ? `?${search}` : ''
}
