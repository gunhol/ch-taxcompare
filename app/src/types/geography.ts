import type { Feature, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'

export type ChurchOption = 'none' | 'protestant' | 'romanCatholic' | 'christianCatholic'
export type Household =
  | 'single'
  | 'singleWithChildren'
  | 'marriedSingleNoChildren'
  | 'marriedSingleWithChildren'
  | 'marriedDualNoChildren'
  | 'marriedDualWithChildren'
export type ViewName = 'compare' | 'rankings' | 'method'
export type SortKey = 'value-asc' | 'value-desc' | 'name'

export interface IncomeProfileDataset {
  year: 2026
  household: Household
  church: ChurchOption
  incomes: number[]
  rates: Record<string, [number, number, number, number][]>
}

export interface MunicipalityProperties {
  bfsId: number
  name: string
  canton: string
  cantonName: string
  cantonNumber: number
  district: string
  special: boolean
}

export interface CantonProperties {
  number: number
  abbr: string
  name: string
}

export type MunicipalityFeature = Feature<Geometry, MunicipalityProperties>
export type CantonFeature = Feature<Geometry, CantonProperties>

export type SwissTopology = Topology<{
  country: GeometryCollection
  cantons: GeometryCollection<CantonProperties>
  municipalities: GeometryCollection<MunicipalityProperties>
  lakes: GeometryCollection
}>

export interface Geography {
  topology: SwissTopology
  municipalities: MunicipalityFeature[]
  cantons: CantonFeature[]
  country: Feature<Geometry>
  lakes: Feature<Geometry>[]
}

export interface IncomeTaxBreakdown {
  value: number
  total: number
  cantonTax: number
  communeTax: number
  churchTax: number
  federalTax: number
  effectiveRate: number
}

export interface RankedMunicipality extends MunicipalityProperties, IncomeTaxBreakdown {
  feature: MunicipalityFeature
}
