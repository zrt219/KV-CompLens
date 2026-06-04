export const subjectFactId = (field: string) => `subject:${field}`
export const sourceScanFactId = (field: string) => `source-scan:${field}`
export const valuationFactId = (field: string) => `valuation:${field}`
export const comparableFactId = (comparableId: string, field: string) => `comparable:${comparableId}:${field}`
export const adjustmentFactId = (comparableId: string, field: string) => `adjustment:${comparableId}:${field}`
export const riskFactId = (scope: string, field: string) => `risk:${scope}:${field}`
export const auditFactId = (field: string) => `audit:${field}`
