"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Zap,
  AlertTriangle,
  TrendingUp,
  Sliders,
  Settings,
  Menu,
  Bell,
  User,
  Download,
  Eye,
  Glasses,
  CheckCircle,
  Ticket,
  Calendar,
  Wrench,
  Cable as Cube,
  MessageCircle,
  X,
  Users,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ChatAssistant from "@/components/chat-assistant"
import BIMViewer from "@/components/bim/bim-viewer"
import { CrowdDensityHeatmap } from "@/components/crowd-density-heatmap"
import { INITIAL_OFFICE_ALERTS } from "@/lib/bim/office-alerts"
import { OFFICE_ASSETS } from "@/lib/bim/office-assets"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedAsset, setSelectedAsset] = useState("chiller-01")
  const [weatherTemp, setWeatherTemp] = useState(22)
  const [occupancy, setOccupancy] = useState(150)
  const [simulationResults, setSimulationResults] = useState(null)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set())
  const [forecastData, setForecastData] = useState(null)
  const [vrMode, setVrMode] = useState(false)
  const [arMode, setArMode] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState("chiller-01")
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }
        )
      )
    }

    updateClock()

    const interval = window.setInterval(
      updateClock,
      1000
    )

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const handleSimulate = () => {
    setSimulationResults({
      predictedTemp: 20 + (weatherTemp - 22) * 0.3,
      predictedHumidity: 50 + (occupancy - 150) * 0.05,
      timeToThreshold: Math.max(2, 8 - Math.abs(weatherTemp - 22) * 0.5),
    })
  }

  const handleRunForecast = () => {
    setForecastData({
      hours: Array.from({ length: 48 }, (_, i) => ({
        hour: `${i}h`,
        temp: 20 + Math.sin(i / 8) * 3 + Math.random() * 2,
        humidity: 50 + Math.cos(i / 10) * 10 + Math.random() * 5,
        energy: 2.4 + Math.sin(i / 12) * 0.8,
      })),
    })
  }

  const handleAcknowledgeAlert = (alertId) => {
    setAcknowledgedAlerts(new Set([...acknowledgedAlerts, alertId]))
  }

  const handleExportReport = () => {
    const report = `
PREDICTIVE MAINTENANCE REPORT
Generated: ${new Date().toLocaleString()}

ASSET HEALTH SUMMARY:
${assets.map((a) => `- ${a.name}: ${a.health}% (${a.status})`).join("\n")}

ACTIVE ALERTS:
${alerts.map((a) => `- ${a.asset}: ${a.type} (${a.severity}) - ${a.failureTime}`).join("\n")}

SIMULATION RESULTS:
${simulationResults ? `Temperature: ${simulationResults.predictedTemp.toFixed(1)}°C\nHumidity: ${simulationResults.predictedHumidity.toFixed(1)}%` : "No simulation run yet"}
    `
    const blob = new Blob([report], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `maintenance-report-${new Date().getTime()}.txt`
    a.click()
  }

  const metrics = [
    { label: "Temperature", value: "21°C", unit: "±1°C", status: "healthy", icon: "🌡️" },
    { label: "Humidity", value: "50%", unit: "±5% RH", status: "healthy", icon: "💧" },
    { label: "CO₂ Levels", value: "420 ppm", unit: "Normal", status: "healthy", icon: "💨" },
    { label: "Energy", value: "2.4 kW", unit: "Current", status: "warning", icon: "⚡" },
  ]

  const assets = OFFICE_ASSETS.map((asset) => ({
    id: asset.id,
    name: asset.displayName,
    health: asset.health,
    status:
      asset.status.charAt(0).toUpperCase() +
      asset.status.slice(1),
    maintenance: "Current",
    nextMaint: "To be scheduled",
    location: "Office",
    model: asset.ifcName,
    efficiency: asset.health,
    globalId: asset.globalId,
  }))

  const alerts = INITIAL_OFFICE_ALERTS.map(
    (alert, index) => ({
      id: alert.id,
      asset:
        OFFICE_ASSETS.find(
          (asset) => asset.id === alert.assetId
        )?.displayName ?? alert.assetId,
      type: alert.title,
      severity:
        alert.severity.charAt(0).toUpperCase() +
        alert.severity.slice(1),
      failureTime: "Active",
      confidence: 100 - index * 6,
      action: alert.message,
    })
  )

  const criticalGlobalIds = alerts
    .filter(
      (alert) =>
        alert.severity === "Critical" &&
        !acknowledgedAlerts.has(alert.id)
    )
    .map((alert) => {
      const asset =
        assets.find(
          (asset) =>
            asset.name === alert.asset
        )

      return asset?.globalId
    })
    .filter(
      (globalId): globalId is string =>
        Boolean(globalId)
    )

  const rulData = [
    { day: "Day 1", chiller: 28, panelboard: 42, rooftopFan: 12 },
    { day: "Day 5", chiller: 26, panelboard: 40, rooftopFan: 10 },
    { day: "Day 10", chiller: 24, panelboard: 38, rooftopFan: 8 },
    { day: "Day 15", chiller: 22, panelboard: 36, rooftopFan: 6 },
    { day: "Day 20", chiller: 20, panelboard: 34, rooftopFan: 4 },
    { day: "Day 25", chiller: 18, panelboard: 32, rooftopFan: 2 },
    { day: "Day 30", chiller: 16, panelboard: 30, rooftopFan: 1 },
  ]

  const maintenanceSchedule = [
    {
      asset: "Air-Cooled Screw Chiller",
      date: "2026-10-08",
      type: "Inspection",
      status: "Scheduled",
    },
    {
      asset: "Lighting Panelboard F1",
      date: "2026-10-15",
      type: "Preventive",
      status: "Scheduled",
    },
    {
      asset: "Rooftop Centrifugal Fan",
      date: "2026-10-05",
      type: "Corrective",
      status: "Critical",
    },
  ]

  const analyticsData = [
    {
      name: "HVAC",
      value: 67,
      fill: "#10b981",
    },
    {
      name: "Electrical",
      value: 33,
      fill: "#3b82f6",
    },
  ]

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Warning":
      case "Major":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "Minor":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getHealthColor = (health) => {
    if (health >= 85) return "text-green-400"
    if (health >= 70) return "text-amber-400"
    return "text-red-400"
  }

  const getStatusBg = (status) => {
    switch (status) {
      case "Healthy":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Warning":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "digital-twin":
        return (
          <DigitalTwinView
            assets={assets}
            alerts={alerts}
            criticalGlobalIds={
              criticalGlobalIds
            }
            selectedEquipment={selectedEquipment}
            setSelectedEquipment={setSelectedEquipment}
            weatherTemp={weatherTemp}
            setWeatherTemp={setWeatherTemp}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
            simulationResults={simulationResults}
            handleSimulate={handleSimulate}
            getHealthColor={getHealthColor}
            getStatusBg={getStatusBg}
            getSeverityColor={getSeverityColor}
          />
        )
      case "dashboard":
        return (
          <OfficeDashboardView
            assets={assets}
            alerts={alerts}
            onSelectAsset={(assetId) => {
              setSelectedEquipment(assetId)
              setActiveTab("digital-twin")
            }}
          />
        )
      case "assets":
        return <AssetsView assets={assets} getHealthColor={getHealthColor} getStatusBg={getStatusBg} />
      case "alerts":
        return (
          <AlertsView
            alerts={alerts}
            getSeverityColor={getSeverityColor}
            acknowledgedAlerts={acknowledgedAlerts}
            handleAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )
      case "analytics":
        return (
          <AnalyticsView rulData={rulData} analyticsData={analyticsData} maintenanceSchedule={maintenanceSchedule} />
        )
      case "simulation":
        return (
          <SimulationView
            weatherTemp={weatherTemp}
            setWeatherTemp={setWeatherTemp}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
            simulationResults={simulationResults}
            handleSimulate={handleSimulate}
            forecastData={forecastData}
          />
        )
      case "crowd-density":
        return <CrowdDensityHeatmap />
      case "settings":
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              <Menu className="w-6 h-6 text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              {/* Animated 3D Wireframe Sphere */}
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 animate-spin-slow">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Outer circles */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient1)" strokeWidth="1" opacity="0.6" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#gradient1)" strokeWidth="1" opacity="0.4" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="url(#gradient1)" strokeWidth="1" opacity="0.3" />

                    {/* Horizontal lines */}
                    <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.5" />
                    <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.4" />

                    {/* Vertical lines */}
                    <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="url(#gradient3)" strokeWidth="1" opacity="0.5" />
                    <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="url(#gradient3)" strokeWidth="1" opacity="0.4" />

                    {/* Center glow */}
                    <circle cx="50" cy="50" r="8" fill="url(#gradient4)" opacity="0.8" />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <radialGradient id="gradient4">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* Pulsing inner glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-500/50"></div>
                </div>
              </div>

              <h1 className="text-xl font-bold text-white">
                OFFICE DIGITAL TWIN
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Last updated: {currentTime}
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-300" />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <User className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "w-64" : "w-0"} hidden lg:block border-r border-slate-800/50 bg-slate-950/50 backdrop-blur-xl transition-all duration-300 overflow-hidden`}
        >
          <nav className="p-6 space-y-2">
            <NavItem
              icon={<Cube className="w-5 h-5" />}
              label="Digital Twin"
              active={activeTab === "digital-twin"}
              onClick={() => setActiveTab("digital-twin")}
            />
            <NavItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <NavItem
              icon={<Zap className="w-5 h-5" />}
              label="Assets"
              active={activeTab === "assets"}
              onClick={() => setActiveTab("assets")}
            />
            <NavItem
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Alerts"
              active={activeTab === "alerts"}
              onClick={() => setActiveTab("alerts")}
            />
            <NavItem
              icon={<TrendingUp className="w-5 h-5" />}
              label="Analytics"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            />
            <NavItem
              icon={<Sliders className="w-5 h-5" />}
              label="Simulation"
              active={activeTab === "simulation"}
              onClick={() => setActiveTab("simulation")}
            />
            <NavItem
              icon={<Users className="w-5 h-5" />}
              label="Crowd Density"
              active={activeTab === "crowd-density"}
              onClick={() => setActiveTab("crowd-density")}
            />
            <NavItem
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 lg:pb-6 space-y-6 overflow-auto">
          {renderContent()}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleRunForecast}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Run 48-Hour Forecast
            </Button>
            <Button
              onClick={() => setVrMode(!vrMode)}
              variant="outline"
              className={`border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent ${vrMode ? "bg-blue-600/20 border-blue-500/30" : ""}`}
            >
              <Glasses className="w-4 h-4 mr-2" />
              VR Training Mode {vrMode ? "(Active)" : ""}
            </Button>
            <Button
              onClick={() => setArMode(!arMode)}
              variant="outline"
              className={`border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent ${arMode ? "bg-blue-600/20 border-blue-500/30" : ""}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              AR Technician View {arMode ? "(Active)" : ""}
            </Button>
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* VR/AR Mode Indicators */}
          {(vrMode || arMode) && (
            <Card className="border-slate-800/50 bg-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-4">
                <p className="text-blue-300">
                  {vrMode && "VR Training Mode Active - Immersive technician training environment enabled"}
                  {arMode && "AR Technician View Active - Real-time equipment overlay and maintenance guidance"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Forecast Results */}
          {forecastData && (
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">48-Hour Forecast Results</CardTitle>
                <CardDescription>Predicted environmental conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecastData.hours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis stroke="rgba(148, 163, 184, 0.5)" />
                    <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="Temperature"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Humidity"
                    />
                    <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={false} name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Bottom Tab Navigation - Mobile Only (shown when sidebar hidden on small screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-8 h-16">
          <button
            onClick={() => setActiveTab("digital-twin")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "digital-twin"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Cube className="w-5 h-5" />
            <span className="text-[10px] font-medium">Twin</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "dashboard"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "assets"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-medium">Assets</span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "alerts"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-medium">Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "analytics"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "simulation"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-medium">Sim</span>
          </button>
          <button
            onClick={() => setActiveTab("crowd-density")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "crowd-density"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Crowd</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "settings"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Chat Assistant Button - Adjusted position for mobile bottom nav */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-20 lg:bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-50"
      >
        {chatOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Assistant */}
      {chatOpen && <ChatAssistant onClose={() => setChatOpen(false)} />}
    </div>
  )
}

function DigitalTwinView({
  assets,
  alerts,
  criticalGlobalIds,
  selectedEquipment,
  setSelectedEquipment,
  weatherTemp,
  setWeatherTemp,
  occupancy,
  setOccupancy,
  simulationResults,
  handleSimulate,
  getHealthColor,
  getStatusBg,
  getSeverityColor,
}) {
  const selectedAsset = assets.find((a) => a.id === selectedEquipment)
  const [liveForeccast, setLiveForecast] = useState(null)

  // Generate live 48-hour forecast on component mount
  useEffect(() => {
    const generateLiveForecast = () => {
      const forecastData = Array.from({ length: 48 }, (_, i) => ({
        hour: `${i}h`,
        temp: 21 + Math.sin(i / 8) * 2 + Math.random() * 0.5,
        humidity: 50 + Math.cos(i / 10) * 8 + Math.random() * 3,
        energy: 2.4 + Math.sin(i / 12) * 0.6 + Math.random() * 0.2,
        co2: 420 + Math.sin(i / 6) * 50 + Math.random() * 20,
      }))
      setLiveForecast(forecastData)
    }

    generateLiveForecast()
    // Refresh forecast every 30 minutes
    const interval = setInterval(generateLiveForecast, 1800000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Digital Twin - Virtual Building Model</h2>
        <p className="text-slate-400">Real-time monitoring and predictive analytics of your facility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Building Visualization */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-white">3D Building Model</CardTitle>
              <CardDescription>Interactive virtual representation of your facility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg border border-slate-700/30 overflow-hidden">
                {/* 3D BIM Building Visualization - IFC fragments */}
                <BIMViewer
                  focusGlobalId={
                    selectedAsset?.globalId
                  }
                  criticalGlobalIds={
                    criticalGlobalIds
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Monitoring */}
        <div className="space-y-4">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-sm">Real-Time Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Temperature</p>
                <p className="text-xl font-bold text-white">21.5°C</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-3/4 bg-green-500" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Humidity</p>
                <p className="text-xl font-bold text-white">48%</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-1/2 bg-blue-500" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Air Pressure</p>
                <p className="text-xl font-bold text-white">1013 mb</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-2/3 bg-green-500" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Energy Usage</p>
                <p className="text-xl font-bold text-white">2.4 kW</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-1/3 bg-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live 48-Hour Forecast and System Status - Side by Side */}
      {liveForeccast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 48-Hour Forecast - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">48-Hour Environmental Forecast</CardTitle>
                    <CardDescription>Predicted environmental conditions and trends</CardDescription>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">Live Data</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg Temp</p>
                    <p className="text-lg font-bold text-white">
                      {(liveForeccast.reduce((acc: number, d: any) => acc + d.temp, 0) / liveForeccast.length).toFixed(1)}°C
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg Humidity</p>
                    <p className="text-lg font-bold text-white">
                      {(liveForeccast.reduce((acc: number, d: any) => acc + d.humidity, 0) / liveForeccast.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg Energy</p>
                    <p className="text-lg font-bold text-white">
                      {(liveForeccast.reduce((acc: number, d: any) => acc + d.energy, 0) / liveForeccast.length).toFixed(2)} kW
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg CO₂</p>
                    <p className="text-lg font-bold text-white">
                      {Math.round(liveForeccast.reduce((acc: number, d: any) => acc + d.co2, 0) / liveForeccast.length)} ppm
                    </p>
                  </div>
                </div>

                {/* Forecast Chart */}
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={liveForeccast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis
                      dataKey="hour"
                      stroke="rgba(148, 163, 184, 0.5)"
                      tick={{ fontSize: 11 }}
                      interval={5}
                    />
                    <YAxis stroke="rgba(148, 163, 184, 0.5)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="Temp (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Humidity (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Energy (kW)"
                    />
                    <Line
                      type="monotone"
                      dataKey="co2"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="CO₂ (ppm)"
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Compact Insights */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs font-medium text-blue-300 mb-1">📊 Trend Analysis</p>
                    <p className="text-xs text-slate-300">
                      Office environmental conditions are stable and within the configured operating range.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs font-medium text-green-300 mb-1">✓ System Status</p>
                    <p className="text-xs text-slate-300">
                      HVAC operating normally. Energy within expected parameters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status - Takes 1 column on right */}
          <div className="lg:col-span-1">
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
              <CardHeader>
                <CardTitle className="text-white text-sm">System Status</CardTitle>
                <CardDescription className="text-xs">Equipment health overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">HVAC</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">Elevators</span>
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">Monitor</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">Lighting</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">Optimal</Badge>
                </div>
                {/* Additional System Info */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-2">Overall Health</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-[82%] bg-gradient-to-r from-amber-500 to-green-500" />
                    </div>
                    <span className="text-sm font-bold text-white">82%</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Selected Equipment Details */}
      {selectedAsset && (
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white">{selectedAsset.name}</CardTitle>
                <CardDescription>{selectedAsset.location}</CardDescription>
              </div>
              <Badge className={getStatusBg(selectedAsset.status)}>{selectedAsset.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthColor(selectedAsset.health)}`}>{selectedAsset.health}%</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Efficiency</p>
                <p className="text-2xl font-bold text-blue-400">{selectedAsset.efficiency}%</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Last Maintenance</p>
                <p className="text-sm font-bold text-white">{selectedAsset.maintenance}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Next Maintenance</p>
                <p className="text-sm font-bold text-white">{selectedAsset.nextMaint}</p>
              </div>
            </div>

            {/* Predictive Alerts for Selected Equipment */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-white mb-3">Predictive Alerts</h4>
              <div className="space-y-2">
                {alerts
                  .filter((a) => a.asset === selectedAsset.name)
                  .map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{alert.type}</p>
                          <p className="text-xs text-slate-300 mt-1">{alert.action}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <p className="text-xs text-slate-300 mt-1">{alert.failureTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                {alerts.filter((a) => a.asset === selectedAsset.name).length === 0 && (
                  <p className="text-sm text-slate-400">No active alerts for this equipment</p>
                )}
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Wrench className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* What-If Scenario Testing */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">What-If Scenario Testing</CardTitle>
          <CardDescription>Test changes safely before implementing in production</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-3 block">Weather Temperature: {weatherTemp}°C</label>
              <input
                type="range"
                min="15"
                max="45"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>15°C</span>
                <span>45°C</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-3 block">Occupancy Level: {occupancy} people</label>
              <input
                type="range"
                min="0"
                max="500"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0</span>
                <span>500</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSimulate}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Run Simulation
          </Button>
          {simulationResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Predicted Temperature</p>
                <p className="text-lg font-bold text-white">{simulationResults.predictedTemp.toFixed(1)}°C</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Predicted Humidity</p>
                <p className="text-lg font-bold text-white">{simulationResults.predictedHumidity.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-slate-400 mb-1">Time to Threshold</p>
                <p className="text-lg font-bold text-amber-400">{simulationResults.timeToThreshold.toFixed(1)}h</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface OfficeDashboardAsset {
  id: string
  name: string
  health: number
}

interface OfficeDashboardAlert {
  id: string
  severity: string
  type: string
}

function OfficeDashboardView({
  assets,
  alerts,
  onSelectAsset,
}: {
  assets: OfficeDashboardAsset[]
  alerts: OfficeDashboardAlert[]
  onSelectAsset: (assetId: string) => void
}) {
  const orderedAlerts = [...alerts].sort((a, b) =>
    a.severity === "Critical" ? -1 : b.severity === "Critical" ? 1 : 0
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          OFFICE DIGITAL TWIN
        </h2>
        <p className="mt-1 text-slate-400">
          Building equipment health and active maintenance alerts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Asset Health</p>
            <p className="mt-2 text-3xl font-bold text-white">3</p>
            <p className="mt-1 text-xs text-slate-500">Tracked Assets</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Active Alerts</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">2</p>
            <p className="mt-1 text-xs text-slate-500">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Critical Alert</p>
            <p className="mt-2 text-3xl font-bold text-red-400">1</p>
            <p className="mt-1 text-xs text-slate-500">Immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelectAsset(asset.id)}
                className="block w-full text-left"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-200">{asset.name}</span>
                  <span className={`text-sm font-semibold ${
                    asset.health >= 85
                      ? "text-emerald-400"
                      : asset.health >= 70
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}>
                    {asset.health}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full ${
                      asset.health >= 85
                        ? "bg-emerald-400"
                        : asset.health >= 70
                          ? "bg-amber-400"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${asset.health}%` }}
                  />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/40 p-3"
              >
                <span
                  className={`text-[11px] font-bold ${
                    alert.severity === "Critical"
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {alert.severity.toUpperCase()}
                </span>
                <span className="text-sm text-slate-200">{alert.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardView({
  metrics,
  assets,
  alerts,
  rulData,
  selectedAsset,
  setSelectedAsset,
  weatherTemp,
  setWeatherTemp,
  occupancy,
  setOccupancy,
  simulationResults,
  handleSimulate,
  getSeverityColor,
  getHealthColor,
  getStatusBg,
  acknowledgedAlerts,
  handleAcknowledgeAlert,
}) {
  return (
    <>
      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card
            key={idx}
            className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl hover:bg-slate-900/70 transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{metric.unit}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${metric.status === "healthy" ? "bg-green-500/20" : "bg-amber-500/20"}`}
                >
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset Health & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Health Overview */}
        <div className="lg:col-span-1">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-white">Asset Health</CardTitle>
              <CardDescription>Critical assets overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer border border-slate-700/30"
                  onClick={() => setSelectedAsset(asset.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{asset.name}</p>
                      <Badge className={`mt-1 ${getStatusBg(asset.status)}`}>{asset.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getHealthColor(asset.health)}`}>{asset.health}%</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${asset.health >= 85 ? "bg-green-500" : asset.health >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${asset.health}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <p>Last: {asset.maintenance}</p>
                    <p>Next: {asset.nextMaint}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Alert Management */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-white">Active Alerts</CardTitle>
              <CardDescription>Priority-sorted by severity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} bg-opacity-10 ${acknowledgedAlerts.has(alert.id) ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-white">{alert.asset}</p>
                      <p className="text-sm text-slate-300">{alert.type}</p>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-slate-400">Failure Time</p>
                      <p className="text-white font-medium">{alert.failureTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Confidence</p>
                      <p className="text-white font-medium">{alert.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Action</p>
                      <p className="text-white font-medium">{alert.action}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      variant="outline"
                      className="text-xs h-7 bg-transparent"
                      disabled={acknowledgedAlerts.has(alert.id)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {acknowledgedAlerts.has(alert.id) ? "Acknowledged" : "Acknowledge"}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent">
                      <Ticket className="w-3 h-3 mr-1" />
                      Create Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics & Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUL Chart */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Predicted RUL (30 Days)</CardTitle>
            <CardDescription>Remaining useful life for selected assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rulData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
                <Line type="monotone" dataKey="chiller" stroke="#10b981" strokeWidth={2} dot={false} name="Chiller" />
                <Line type="monotone" dataKey="panelboard" stroke="#3b82f6" strokeWidth={2} dot={false} name="Panelboard" />
                <Line type="monotone" dataKey="rooftopFan" stroke="#ef4444" strokeWidth={2} dot={false} name="Rooftop Fan" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Climate Simulation */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Climate Simulation</CardTitle>
            <CardDescription>What-if scenario analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Weather Temperature: {weatherTemp}°C</label>
              <input
                type="range"
                min="15"
                max="45"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Occupancy Level: {occupancy} people</label>
              <input
                type="range"
                min="0"
                max="500"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSimulate}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Simulate Impact
            </Button>
            {simulationResults && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 space-y-2">
                <div>
                  <p className="text-xs text-slate-400">Predicted Office Temp</p>
                  <p className="text-lg font-bold text-white">{simulationResults.predictedTemp.toFixed(1)}°C</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Predicted Humidity</p>
                  <p className="text-lg font-bold text-white">{simulationResults.predictedHumidity.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Time to Threshold</p>
                  <p className="text-lg font-bold text-amber-400">
                    {simulationResults.timeToThreshold.toFixed(1)} hours
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AssetsView({ assets, getHealthColor, getStatusBg }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Asset Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl hover:bg-slate-900/70 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{asset.name}</CardTitle>
                    <CardDescription>{asset.location}</CardDescription>
                  </div>
                  <Badge className={getStatusBg(asset.status)}>{asset.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Health Score</span>
                    <span className={`text-lg font-bold ${getHealthColor(asset.health)}`}>{asset.health}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${asset.health >= 85 ? "bg-green-500" : asset.health >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${asset.health}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">Model</p>
                    <p className="text-white font-medium">{asset.model}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Efficiency</p>
                    <p className="text-white font-medium">{asset.efficiency}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">Last Maintenance</p>
                    <p className="text-white font-medium">{asset.maintenance}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Next Maintenance</p>
                    <p className="text-white font-medium">{asset.nextMaint}</p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Wrench className="w-4 h-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function AlertsView({ alerts, getSeverityColor, acknowledgedAlerts, handleAcknowledgeAlert }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Alert Management</h2>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-slate-800/50 bg-slate-900/50 backdrop-blur-xl ${acknowledgedAlerts.has(alert.id) ? "opacity-60" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">{alert.asset}</h3>
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      {acknowledgedAlerts.has(alert.id) && (
                        <Badge className="bg-green-500/20 text-green-400">Acknowledged</Badge>
                      )}
                    </div>
                    <p className="text-slate-300 mb-3">{alert.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Failure Time</p>
                    <p className="text-white font-medium">{alert.failureTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Confidence</p>
                    <p className="text-white font-medium">{alert.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Recommended Action</p>
                    <p className="text-white font-medium">{alert.action}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <p
                      className={`font-medium ${acknowledgedAlerts.has(alert.id) ? "text-green-400" : "text-amber-400"}`}
                    >
                      {acknowledgedAlerts.has(alert.id) ? "Acknowledged" : "Active"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    disabled={acknowledgedAlerts.has(alert.id)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {acknowledgedAlerts.has(alert.id) ? "Acknowledged" : "Acknowledge Alert"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Create Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalyticsView({ rulData, analyticsData, maintenanceSchedule }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics & Insights</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUL Trends */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">RUL Trends (30 Days)</CardTitle>
            <CardDescription>Remaining useful life projections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rulData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
                <Line type="monotone" dataKey="chiller" stroke="#10b981" strokeWidth={2} name="Chiller" />
                <Line type="monotone" dataKey="panelboard" stroke="#3b82f6" strokeWidth={2} name="Panelboard" />
                <Line type="monotone" dataKey="rooftopFan" stroke="#ef4444" strokeWidth={2} name="Rooftop Fan" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Asset Distribution</CardTitle>
            <CardDescription>By system type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Schedule */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Maintenance Schedule</CardTitle>
          <CardDescription>Upcoming and overdue maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceSchedule.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 flex items-start justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{item.asset}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">{item.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      item.status === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : item.status === "Urgent"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                    }
                  >
                    {item.status}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-2">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SimulationView({
  weatherTemp,
  setWeatherTemp,
  occupancy,
  setOccupancy,
  simulationResults,
  handleSimulate,
  forecastData,
}) {
  const [aiSimResults, setAiSimResults] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simType, setSimType] = useState("environmental")
  const [duration, setDuration] = useState(24)
  const [outdoorHumidity, setOutdoorHumidity] = useState(60)
  const [hvacMode, setHvacMode] = useState("auto")

  const runAISimulation = async () => {
    setSimLoading(true)
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: simType,
          parameters: {
            weatherTemp,
            occupancy,
            duration,
            outdoorHumidity,
            hvacMode,
            currentTemp: 21.5,
            currentHumidity: 48,
          },
        }),
      })

      if (!response.ok) throw new Error("Simulation failed")

      const data = await response.json()
      setAiSimResults(data.results)
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI-Driven Simulation Engine</h2>
        <p className="text-slate-400 mt-2">
          Advanced predictive modeling for building performance and environmental control
        </p>
      </div>

      {/* Simulation Type Selector */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Simulation Scenario</CardTitle>
          <CardDescription>Choose the type of analysis to perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSimType("environmental")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "environmental"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">🌡️</div>
              <div className="text-sm font-medium">Environmental</div>
            </button>
            <button
              onClick={() => setSimType("equipment-stress")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "equipment-stress"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium">Equipment</div>
            </button>
            <button
              onClick={() => setSimType("energy-optimization")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "energy-optimization"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium">Energy</div>
            </button>
            <button
              onClick={() => setSimType("emergency")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "emergency"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">🚨</div>
              <div className="text-sm font-medium">Emergency</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advanced Parameters */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Simulation Parameters</CardTitle>
            <CardDescription>Configure environmental and operational conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Outdoor Temperature</span>
                <span className="text-white font-medium">{weatherTemp}°C</span>
              </label>
              <input
                type="range"
                min="-10"
                max="45"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>-10°C</span>
                <span>45°C</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Office Occupancy</span>
                <span className="text-white font-medium">{occupancy} people</span>
              </label>
              <input
                type="range"
                min="0"
                max="500"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Empty</span>
                <span>Full (500)</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Outdoor Humidity</span>
                <span className="text-white font-medium">{outdoorHumidity}%</span>
              </label>
              <input
                type="range"
                min="20"
                max="95"
                value={outdoorHumidity}
                onChange={(e) => setOutdoorHumidity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Dry (20%)</span>
                <span>Humid (95%)</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Simulation Duration</span>
                <span className="text-white font-medium">{duration}h</span>
              </label>
              <input
                type="range"
                min="6"
                max="72"
                step="6"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>6 hours</span>
                <span>72 hours</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block">HVAC Operating Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {["auto", "cooling", "heating"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setHvacMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hvacMode === mode
                        ? "bg-blue-600/20 border border-blue-500/50 text-blue-300"
                        : "bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={runAISimulation}
              disabled={simLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {simLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Intelligent Simulation...
                </div>
              ) : (
                "🧠 Run AI Simulation"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Simulation Results */}
        {aiSimResults && (
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Intelligent Analysis Results
                <Badge className="bg-green-500/20 text-green-400">
                  {aiSimResults.confidence}% Confidence
                </Badge>
              </CardTitle>
              <CardDescription>AI-generated predictions and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-white">{aiSimResults.predictedTemp}°C</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-white">{aiSimResults.predictedHumidity}%</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Energy Usage</p>
                  <p className="text-2xl font-bold text-white">{aiSimResults.predictedEnergy} kW</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-slate-400 mb-1">Time to Limit</p>
                  <p className="text-2xl font-bold text-amber-400">{aiSimResults.timeToThreshold}h</p>
                </div>
              </div>

              {/* Equipment Stress */}
              {aiSimResults.equipmentStress && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Equipment Stress Levels</p>
                  {Object.entries(aiSimResults.equipmentStress).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-white font-medium">{value}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {aiSimResults.recommendations && aiSimResults.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">💡 Recommendations</p>
                  {aiSimResults.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {aiSimResults.warnings && aiSimResults.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">⚠️ Warnings</p>
                  {aiSimResults.warnings.map((warn: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300"
                    >
                      {warn}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Chart */}
      {aiSimResults && aiSimResults.chartData && (
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Predicted Trends - {duration} Hour Forecast</CardTitle>
            <CardDescription>Hour-by-hour environmental and energy predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={aiSimResults.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="hour" stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} name="Energy (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">System Configuration</CardTitle>
            <CardDescription>Manage dashboard settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">Alert Thresholds</p>
              <p className="text-xs text-slate-400">Configure when alerts should trigger</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Configure Thresholds
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">Notification Preferences</p>
              <p className="text-xs text-slate-400">Manage how you receive alerts</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Edit Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
            <CardDescription>Manage team access and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">Team Members</p>
              <p className="text-xs text-slate-400">Add or remove team members</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Manage Team
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">API Keys</p>
              <p className="text-xs text-slate-400">Generate and manage API keys</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Manage API Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">System Information</CardTitle>
          <CardDescription>Dashboard version and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <span className="text-slate-300">Dashboard Version</span>
            <span className="text-white font-medium">v2.1.0</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <span className="text-slate-300">System Status</span>
            <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <span className="text-slate-300">Last Updated</span>
            <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:bg-slate-800/50"}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
