export type Discipline =
  | "architecture"
  | "structural"
  | "hvac"
  | "electrical"

export interface BIMModelConfig {
  id: Discipline
  name: string
  fragmentUrl: string
}

export interface BIMElementProperties {
  modelId: string
  localId: number
  globalId?: string
  ifcClass?: string
  name?: string
  floor?: string
  properties?: Record<string, unknown>
}