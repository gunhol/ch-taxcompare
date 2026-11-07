import type { ChurchOption, Household, IncomeProfileDataset, IncomeTaxBreakdown } from '../types/geography'

export const INCOME_BRACKETS = [
  15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000,
  200000, 250000, 300000, 400000, 500000, 750000, 1000000,
  5000000, 10000000, 50000000, 100000000,
]

export function profileFilename(household: Household, church: ChurchOption): string {
  return `${household}-${church}.json`
}

export function incomeTaxValue(
  profile: IncomeProfileDataset,
  bfsId: number,
  income: number,
  includeFederal = false,
): IncomeTaxBreakdown {
  const incomeIndex = profile.incomes.indexOf(income)
  if (incomeIndex < 0) throw new Error(`No official ESTV profile for CHF ${income}`)
  const components = profile.rates[String(bfsId)]?.[incomeIndex]
  if (!components) throw new Error(`No official ESTV 2026 income data for BFS ${bfsId}`)
  const [cantonTax, communeTax, churchTax, federalTax] = components
  const total = cantonTax + communeTax + churchTax + (includeFederal ? federalTax : 0)
  return {
    value: total,
    total,
    cantonTax,
    communeTax,
    churchTax,
    federalTax,
    effectiveRate: total * 100 / income,
  }
}
