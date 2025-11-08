"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Person {
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
  lastTargetUpdate: number
}

interface CrowdDensityHeatmapProps {
  className?: string
}

export function CrowdDensityHeatmap({ className }: CrowdDensityHeatmapProps) {
  const floorPlanRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [liveMode, setLiveMode] = useState(false)
  const [liveSpeed, setLiveSpeed] = useState(1)
  const animationFrameRef = useRef<number>()
  const movementIntervalRef = useRef<NodeJS.Timeout>()
  const entryExitIntervalRef = useRef<NodeJS.Timeout>()

  // System metrics
  const [occupancy, setOccupancy] = useState(0)
  const [hvacPower, setHvacPower] = useState(25)
  const [lightingLevel, setLightingLevel] = useState(50)
  const [energyConsumption, setEnergyConsumption] = useState(3.2)

  // Resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && floorPlanRef.current) {
        canvasRef.current.width = floorPlanRef.current.offsetWidth
        canvasRef.current.height = floorPlanRef.current.offsetHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Calculate local density around a point
  const calculateLocalDensity = (x: number, y: number): number => {
    let nearby = 0
    const threshold = 15

    people.forEach(person => {
      const dx = person.x - x
      const dy = person.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < threshold) nearby++
    })

    return nearby
  }

  // Get heatmap color based on density
  const getHeatmapColor = (density: number): string => {
    if (density <= 2) return "rgba(59, 130, 246, 0.4)"      // Blue - low
    if (density <= 4) return "rgba(34, 197, 94, 0.5)"       // Green - medium
    if (density <= 7) return "rgba(234, 179, 8, 0.6)"       // Yellow - high
    return "rgba(239, 68, 68, 0.7)"                          // Red - very high
  }

  // Draw heatmap on canvas
  const drawHeatmap = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (people.length === 0) return

    const radius = 80

    people.forEach(person => {
      const x = (person.x / 100) * canvas.width
      const y = (person.y / 100) * canvas.height

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

      const localDensity = calculateLocalDensity(person.x, person.y)
      const color = getHeatmapColor(localDensity)

      gradient.addColorStop(0, color)
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = gradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    })

    ctx.globalCompositeOperation = "source-over"
  }

  // Update system metrics based on occupancy
  useEffect(() => {
    const occupancyCount = people.length
    const maxOccupancy = 200
    const occupancyRatio = occupancyCount / maxOccupancy

    setOccupancy(occupancyCount)
    setHvacPower(Math.round(25 + occupancyRatio * 75))
    setLightingLevel(Math.round(50 + occupancyRatio * 50))
    setEnergyConsumption(parseFloat((2 + occupancyRatio * 8).toFixed(1)))

    drawHeatmap()
  }, [people])

  // Add person at position
  const addPerson = (x: number, y: number, hasMovement = true) => {
    const newPerson: Person = {
      x,
      y,
      vx: hasMovement ? (Math.random() - 0.5) * 0.3 : 0,
      vy: hasMovement ? (Math.random() - 0.5) * 0.3 : 0,
      targetX: x,
      targetY: y,
      lastTargetUpdate: Date.now()
    }

    setPeople(prev => [...prev, newPerson])
  }

  // Add random people
  const addRandomPeople = (count: number) => {
    const newPeople: Person[] = []
    for (let i = 0; i < count; i++) {
      newPeople.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        targetX: Math.random() * 100,
        targetY: Math.random() * 100,
        lastTargetUpdate: Date.now()
      })
    }
    setPeople(prev => [...prev, ...newPeople])
  }

  // Remove people
  const removePeople = (count: number) => {
    setPeople(prev => prev.slice(0, -Math.min(count, prev.length)))
  }

  // Clear all people
  const clearAll = () => {
    setPeople([])
  }

  // Set scenario
  const setScenario = (scenario: string) => {
    clearAll()
    setTimeout(() => {
      switch (scenario) {
        case "empty":
          addRandomPeople(5)
          break
        case "normal":
          addRandomPeople(40)
          break
        case "busy":
          addRandomPeople(80)
          break
        case "event":
          addRandomPeople(150)
          break
      }
    }, 100)
  }

  // Move people in live mode
  const movePeople = () => {
    setPeople(prev => {
      const currentTime = Date.now()

      return prev.map(person => {
        let updated = { ...person }

        // Update target position every 3-5 seconds
        if (currentTime - person.lastTargetUpdate > (3000 + Math.random() * 2000) / liveSpeed) {
          updated.targetX = Math.random() * 100
          updated.targetY = Math.random() * 100
          updated.lastTargetUpdate = currentTime
        }

        // Move towards target
        const dx = updated.targetX - updated.x
        const dy = updated.targetY - updated.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0.5) {
          const speed = 0.1 * liveSpeed
          updated.x += (dx / distance) * speed
          updated.y += (dy / distance) * speed

          // Keep within bounds
          updated.x = Math.max(5, Math.min(95, updated.x))
          updated.y = Math.max(5, Math.min(95, updated.y))
        }

        return updated
      })
    })
  }

  // Toggle live mode
  const toggleLiveMode = () => {
    setLiveMode(prev => !prev)
  }

  // Live mode effect
  useEffect(() => {
    if (liveMode) {
      // Start movement
      movementIntervalRef.current = setInterval(movePeople, 50)

      // Random people entering and leaving
      entryExitIntervalRef.current = setInterval(() => {
        setPeople(prev => {
          if (Math.random() > 0.5 && prev.length < 150) {
            // Someone enters
            const side = Math.floor(Math.random() * 4)
            let x: number, y: number
            switch (side) {
              case 0: x = Math.random() * 100; y = 2; break  // top
              case 1: x = 98; y = Math.random() * 100; break // right
              case 2: x = Math.random() * 100; y = 98; break // bottom
              default: x = 2; y = Math.random() * 100; break // left
            }
            return [...prev, {
              x, y,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
              targetX: Math.random() * 100,
              targetY: Math.random() * 100,
              lastTargetUpdate: Date.now()
            }]
          } else if (prev.length > 10 && Math.random() > 0.7) {
            // Someone leaves
            return prev.slice(0, -1)
          }
          return prev
        })
      }, 2000 / liveSpeed)
    } else {
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current)
      if (entryExitIntervalRef.current) clearInterval(entryExitIntervalRef.current)
    }

    return () => {
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current)
      if (entryExitIntervalRef.current) clearInterval(entryExitIntervalRef.current)
    }
  }, [liveMode, liveSpeed])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawHeatmap()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [people])

  // Handle click on floor plan
  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!floorPlanRef.current) return
    const rect = floorPlanRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    addPerson(x, y)
  }

  // Get status badge variant
  const getStatusVariant = (value: number, thresholds: number[]) => {
    if (value <= thresholds[0]) return "default"
    if (value <= thresholds[1]) return "secondary"
    if (value <= thresholds[2]) return "warning" as any
    return "destructive"
  }

  const getStatusLabel = (value: number, thresholds: number[], labels: string[]) => {
    let level = 0
    for (let i = 0; i < thresholds.length; i++) {
      if (value > thresholds[i]) level = i + 1
    }
    return labels[level] || labels[labels.length - 1]
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Floor Plan Section */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>📍</span>
              <span>Live Floor Plan - Click to Add People</span>
            </h3>
          </div>

          <div
            ref={floorPlanRef}
            onClick={handleFloorPlanClick}
            className="relative w-full aspect-[1.5] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden cursor-crosshair shadow-inner"
          >
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full opacity-70"
            />

            {/* Person dots */}
            {people.map((person, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-lg"
                style={{
                  left: `${person.x}%`,
                  top: `${person.y}%`
                }}
              />
            ))}

            {/* Zone labels */}
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
              Zone A
            </div>
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
              Zone B
            </div>
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
              Zone C
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
              Zone D
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/60" />
              <span className="text-sm">Low Density</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500/60" />
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-500/60" />
              <span className="text-sm">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500/60" />
              <span className="text-sm">Very High</span>
            </div>
          </div>
        </Card>

        {/* Controls Panel */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>⚙️</span>
              <span>Simulation Controls</span>
            </h3>
          </div>

          {/* Crowd Scenarios */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Crowd Scenarios:</label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setScenario("empty")} variant="outline" size="sm">
                🏢 Empty Building
              </Button>
              <Button onClick={() => setScenario("normal")} variant="outline" size="sm">
                👥 Normal Hours
              </Button>
              <Button onClick={() => setScenario("busy")} variant="outline" size="sm">
                🚶 Busy Period
              </Button>
              <Button onClick={() => setScenario("event")} variant="outline" size="sm">
                🎉 Event Mode
              </Button>
            </div>
          </div>

          {/* Live Mode */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Live Mode:</label>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={toggleLiveMode}
                variant={liveMode ? "destructive" : "default"}
                size="sm"
              >
                {liveMode ? "⏸️ Pause" : "▶️ Start"} Live Mode
              </Button>
              <Button onClick={() => setLiveSpeed(0.5)} variant="outline" size="sm">
                🐌 Slow
              </Button>
              <Button onClick={() => setLiveSpeed(1)} variant="outline" size="sm">
                🚶 Normal
              </Button>
              <Button onClick={() => setLiveSpeed(2)} variant="outline" size="sm">
                🏃 Fast
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Quick Actions:</label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => addRandomPeople(20)} variant="outline" size="sm">
                + Add 20 People
              </Button>
              <Button onClick={() => removePeople(20)} variant="outline" size="sm">
                - Remove 20 People
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                🗑️ Clear All
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
            {liveMode && (
              <div className="mb-3 font-bold flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                LIVE MODE ACTIVE - People moving autonomously
              </div>
            )}
            <p className="text-sm">
              <strong>💡 How it works:</strong> The system monitors real-time occupancy through sensors and cameras.
              As crowd density increases, HVAC systems automatically adjust cooling/heating capacity, and lighting
              levels adapt to maintain comfort while optimizing energy consumption.
            </p>
          </div>
        </Card>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-sm text-muted-foreground mb-2">Current Occupancy</div>
          <div className="text-3xl font-bold mb-2">{occupancy}</div>
          <Badge variant={getStatusVariant(occupancy, [30, 80, 120])}>
            {getStatusLabel(occupancy, [30, 80, 120], ["Baseline", "Normal", "Elevated", "High"])}
          </Badge>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-2">❄️</div>
          <div className="text-sm text-muted-foreground mb-2">HVAC Power Output</div>
          <div className="text-3xl font-bold mb-2">{hvacPower}%</div>
          <Badge variant={getStatusVariant(hvacPower, [40, 70, 85])}>
            {getStatusLabel(hvacPower, [40, 70, 85], ["Minimal", "Standard", "High", "Maximum"])}
          </Badge>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-2">💡</div>
          <div className="text-sm text-muted-foreground mb-2">Lighting Level</div>
          <div className="text-3xl font-bold mb-2">{lightingLevel}%</div>
          <Badge variant={getStatusVariant(lightingLevel, [60, 80, 90])}>
            {getStatusLabel(lightingLevel, [60, 80, 90], ["Low", "Standard", "Bright", "Maximum"])}
          </Badge>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-2">⚡</div>
          <div className="text-sm text-muted-foreground mb-2">Energy Consumption</div>
          <div className="text-3xl font-bold mb-2">{energyConsumption} kW</div>
          <Badge variant={getStatusVariant(energyConsumption, [4, 7, 9])}>
            {getStatusLabel(energyConsumption, [4, 7, 9], ["Low", "Normal", "High", "Peak"])}
          </Badge>
        </Card>
      </div>
    </div>
  )
}
