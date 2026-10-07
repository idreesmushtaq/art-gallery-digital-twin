export type AlertSeverity =
  | "warning"
  | "critical"

export interface OfficeAlert {
  id: string
  assetId: string
  severity: AlertSeverity
  title: string
  message: string
  acknowledged: boolean
}

export const INITIAL_OFFICE_ALERTS: OfficeAlert[] = [
  {
    id: "alert-chiller-01",
    assetId: "chiller-01",
    severity: "warning",
    title: "Chiller efficiency warning",
    message:
      "Simulated efficiency is below the preferred operating range.",
    acknowledged: false,
  },

  {
    id: "alert-roof-fan-01",
    assetId: "roof-fan-01",
    severity: "critical",
    title: "Rooftop fan vibration",
    message:
      "Simulated vibration has exceeded the critical threshold.",
    acknowledged: false,
  },
]