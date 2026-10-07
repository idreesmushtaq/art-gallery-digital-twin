import type { BIMModelConfig } from "./types"

export const BIM_MODELS: BIMModelConfig[] = [
  {
    id: "architecture",
    name: "Architecture",
    fragmentUrl: "/models/fragments/architecture.frag",
  },
  {
    id: "structural",
    name: "Structural",
    fragmentUrl: "/models/fragments/structural.frag",
  },
  {
    id: "hvac",
    name: "HVAC",
    fragmentUrl: "/models/fragments/hvac.frag",
  },
  {
    id: "electrical",
    name: "Electrical",
    fragmentUrl: "/models/fragments/electrical.frag",
  },
]