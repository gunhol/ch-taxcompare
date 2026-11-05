import { useCallback, useEffect, useRef, useState } from 'react'
import { profileFilename } from '../lib/income'
import type { ChurchOption, Household, IncomeProfileDataset } from '../types/geography'

const cache = new Map<string, IncomeProfileDataset>()

interface ProfileState {
  key: string
  profile: IncomeProfileDataset | null
  error: string
  loading: boolean
}

export function useIncomeProfile(household: Household, church: ChurchOption) {
  const filename = profileFilename(household, church)
  const cached = cache.get(filename) ?? null
  const [state, setState] = useState<ProfileState>({
    key: filename,
    profile: cached,
    error: '',
    loading: !cached,
  })
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    const completed = cache.get(filename)
    if (completed) {
      setState({ key: filename, profile: completed, error: '', loading: false })
      return
    }
    setState({ key: filename, profile: null, error: '', loading: true })
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/income-profiles/${filename}`)
      if (!response.ok) throw new Error(`Income profile request failed (${response.status})`)
      const profile = await response.json() as IncomeProfileDataset
      if (profile.year !== 2026 || profile.household !== household || profile.church !== church || !profile.rates) {
        throw new Error('The selected official income profile is invalid.')
      }
      cache.set(filename, profile)
      if (requestId.current === id) setState({ key: filename, profile, error: '', loading: false })
    } catch (reason) {
      if (requestId.current !== id) return
      setState({
        key: filename,
        profile: null,
        error: reason instanceof Error ? reason.message : 'The official income profile could not be loaded.',
        loading: false,
      })
    }
  }, [church, filename, household])

  useEffect(() => { void load() }, [load])
  const current = state.key === filename
    ? state
    : { key: filename, profile: cached, error: '', loading: !cached }
  return { ...current, retry: load }
}
