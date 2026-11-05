import { useCallback, useEffect, useState } from 'react'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Geography, MunicipalityFeature, CantonFeature, SwissTopology } from '../types/geography'

export function useGeography() {
  const [data, setData] = useState<Geography | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const geographyResponse = await fetch(`${import.meta.env.BASE_URL}data/ch-2026.json`)
      if (!geographyResponse.ok) throw new Error(`Geography request failed (${geographyResponse.status})`)
      const topology = await geographyResponse.json() as SwissTopology
      const municipalityCollection = feature(topology, topology.objects.municipalities) as unknown as FeatureCollection
      const cantonCollection = feature(topology, topology.objects.cantons) as unknown as FeatureCollection
      const lakeCollection = feature(topology, topology.objects.lakes) as unknown as FeatureCollection
      const municipalities = municipalityCollection.features as MunicipalityFeature[]
      const cantons = (cantonCollection.features as CantonFeature[])
        .sort((a, b) => a.properties.number - b.properties.number)
      setData({
        topology,
        municipalities,
        cantons,
        country: feature(topology, topology.objects.country) as unknown as Feature<Geometry>,
        lakes: lakeCollection.features,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The local comparison data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  return { data, error, loading, retry: load }
}
