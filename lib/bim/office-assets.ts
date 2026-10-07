export type AssetStatus =
  | "healthy"
  | "warning"
  | "critical"

export interface OfficeAsset {
  id: string
  displayName: string
  ifcName: string
  discipline: "hvac" | "electrical"
  localId: number
  globalId: string
  ifcClass: string
  health: number
  status: AssetStatus
}

export const OFFICE_ASSETS: OfficeAsset[] = [
  {
    id: "chiller-01",
    displayName: "Air-Cooled Screw Chiller",
    ifcName:
      "M_Screw Chiller - Air Cooled - 281-1231 kW:633-703 kW:633-703 kW:639187",
    discipline: "hvac",
    localId: 4978,
    globalId:
      "1mxBAZ0xXBzwEwIR452HxA",
    ifcClass:
      "IFCENERGYCONVERSIONDEVICE",
    health: 72,
    status: "warning",
  },

  {
    id: "panel-f1",
    displayName: "Lighting Panelboard F1",
    ifcName:
      "M_Lighting and Appliance Panelboard - 208V MLO:225 A:F1:644953",
    discipline: "electrical",
    localId: 104908,
    globalId:
      "3JRYqJ5Lb4Jhlpa5ORbi8f",
    ifcClass:
      "IFCFLOWCONTROLLER",
    health: 94,
    status: "healthy",
  },

  {
    id: "roof-fan-01",
    displayName: "Rooftop Centrifugal Fan",
    ifcName:
      "M_Centrifugal Fan - Rooftop - Upblast:991-1905 LPS:991-1905 LPS:712138",
    discipline: "electrical",
    localId: 144082,
    globalId:
      "3yWJkHo5T6DAvPfwqyWFQn",
    ifcClass:
      "IFCFLOWMOVINGDEVICE",
    health: 48,
    status: "critical",
  },
]