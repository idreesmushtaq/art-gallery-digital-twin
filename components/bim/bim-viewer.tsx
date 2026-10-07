"use client"

import { useEffect, useRef, useState } from "react"
import * as OBC from "@thatopen/components"
import * as THREE from "three"

import { BIM_MODELS } from "@/lib/bim/model-registry"
import type { Discipline } from "@/lib/bim/types"

type ModelStatus = "loading" | "loaded" | "missing" | "error"

type ModelState = Record<Discipline, ModelStatus>

type DisciplineVisibility = Record<Discipline, boolean>

interface StoreyInfo {
  discipline: Discipline
  storeyId: number
  name: string
  elevation: number | null
  itemIds: number[]
}

interface FloorOption {
  name: string
  elevation: number | null
}

interface SelectedElement {
  modelId: string
  localId: number
  globalId?: string
  ifcClass?: string
  name?: string
  floor?: string
  data?: Record<string, unknown>
}

const INITIAL_VISIBILITY: DisciplineVisibility = {
  architecture: true,
  structural: true,
  hvac: true,
  electrical: true,
}

const INITIAL_MODEL_STATE: ModelState = {
  architecture: "loading",
  structural: "loading",
  hvac: "loading",
  electrical: "loading",
}

const SELECTION_MATERIAL = {
  color: new THREE.Color("#38bdf8"),
  renderedFaces: 2,
  opacity: 1,
  transparent: false,
  preserveOriginalMaterial: true,
} as const

const CRITICAL_MATERIAL = {
  color: new THREE.Color(1, 0, 0),
  renderedFaces: 2,
  opacity: 1,
  transparent: false,
  preserveOriginalMaterial: false,
} as const

interface BIMViewerProps {
  focusGlobalId?: string
  criticalGlobalIds?: string[]
}

export default function BIMViewer({
  focusGlobalId,
  criticalGlobalIds = [],
}: BIMViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const hiderRef = useRef<OBC.Hider | null>(null)
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null)

  const cameraRef =
    useRef<OBC.OrthoPerspectiveCamera | null>(null)

  const rendererRef =
    useRef<OBC.SimpleRenderer | null>(null)

  const previousSelectionRef = useRef<{
    modelId: string
    localId: number
  } | null>(null)
  const storeysRef = useRef<StoreyInfo[]>([])

  const allModelItemsRef =
    useRef<Partial<Record<Discipline, number[]>>>({})

  const [floors, setFloors] =
    useState<FloorOption[]>([])

  const [selectedFloor, setSelectedFloor] =
    useState("all")

  const [status, setStatus] = useState(
    "Initializing BIM viewer..."
  )

  const [error, setError] = useState<string | null>(null)

  const [modelStatus, setModelStatus] =
    useState<ModelState>(INITIAL_MODEL_STATE)

  const [visibility, setVisibility] =
    useState<DisciplineVisibility>(INITIAL_VISIBILITY)

  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null)

  /*
   * DISCIPLINE VISIBILITY
   */

  const toggleDiscipline = async (
    discipline: Discipline
  ) => {
    const hider = hiderRef.current

    if (!hider) return

    if (modelStatus[discipline] !== "loaded") {
      return
    }

    const nextVisible =
      !visibility[discipline]

    try {
      const [visibleItems, hiddenItems] =
        await Promise.all([
          hider.getVisibilityMap(
            true,
            [discipline]
          ),

          hider.getVisibilityMap(
            false,
            [discipline]
          ),
        ])

      const itemIds = [
        ...(visibleItems[discipline] ?? []),
        ...(hiddenItems[discipline] ?? []),
      ]

      const uniqueItemIds = [
        ...new Set(itemIds),
      ]

      if (uniqueItemIds.length === 0) {
        console.warn(
          `[BIM] No items found for ${discipline}`
        )

        return
      }

      await hider.set(
        nextVisible,
        {
          [discipline]: uniqueItemIds,
        }
      )

      setVisibility((previous) => ({
        ...previous,
        [discipline]: nextVisible,
      }))

      if (
        nextVisible &&
        selectedFloor !== "all"
      ) {
        const allIds =
          allModelItemsRef.current[
            discipline
          ] ?? []

        const matchingStorey =
          storeysRef.current.find(
            (storey) =>
              storey.discipline ===
                discipline &&
              storey.name ===
                selectedFloor
          )

        if (allIds.length > 0) {
          if (!matchingStorey) {
            const model =
              fragmentsRef.current?.list.get(
                discipline
              )

            await model?.setVisible(
              allIds,
              false
            )
          } else {
            const floorIds =
              new Set([
                matchingStorey.storeyId,
                ...matchingStorey.itemIds,
              ])

            const model =
              fragmentsRef.current?.list.get(
                discipline
              )

            const itemsToHide =
              allIds.filter(
                (id) => !floorIds.has(id)
              )

            if (itemsToHide.length > 0) {
              await model?.setVisible(
                itemsToHide,
                false
              )
            }

            await model?.setVisible(
              [...floorIds],
              true
            )
          }
        }
      }
    } catch (toggleError) {
      console.error(
        `[BIM] Failed to toggle ${discipline}:`,
        toggleError
      )
    }
  }

  /*
   * CLEAR PREVIOUS SELECTION
   */

const applyFloorFilter = async (
  floorName: string
) => {
  const fragments = fragmentsRef.current

  if (!fragments) return

  try {
    setSelectedFloor(floorName)

    await clearPreviousSelection()
    setSelectedElement(null)

    for (const modelConfig of BIM_MODELS) {
      const discipline = modelConfig.id

      const model =
        fragments.list.get(discipline)

      if (!model) continue

      const allIds =
        allModelItemsRef.current[discipline] ?? []

      if (allIds.length === 0) continue

      /*
       * First restore the model's items.
       *
       * Discipline visibility is applied below.
       */
      await model.setVisible(
        allIds,
        true
      )

      /*
       * If this discipline is switched OFF,
       * it stays OFF regardless of floor.
       */
      if (!visibility[discipline]) {
        await model.setVisible(
          allIds,
          false
        )

        continue
      }

      /*
       * All Floors means the entire active
       * discipline is visible.
       */
      if (floorName === "all") {
        continue
      }

      const matchingStorey =
        storeysRef.current.find(
          (storey) =>
            storey.discipline === discipline &&
            storey.name === floorName
        )

      /*
       * This discipline does not contain the
       * selected storey. Example: T/FDN exists
       * in Structural but not Architecture.
       */
      if (!matchingStorey) {
        await model.setVisible(
          allIds,
          false
        )

        continue
      }

      const floorItems =
        new Set([
          matchingStorey.storeyId,
          ...matchingStorey.itemIds,
        ])

      const itemsToHide =
        allIds.filter(
          (id) => !floorItems.has(id)
        )

      if (itemsToHide.length > 0) {
        await model.setVisible(
          itemsToHide,
          false
        )
      }

      await model.setVisible(
        [...floorItems],
        true
      )
    }
  } catch (floorError) {
    console.error(
      `[BIM] Failed to apply floor ${floorName}:`,
      floorError
    )
  }
}

  const clearPreviousSelection = async () => {
    const fragments = fragmentsRef.current

    const previous =
      previousSelectionRef.current

    if (!fragments || !previous) {
      return
    }

    try {
      const model =
        fragments.list.get(
          previous.modelId
        )

      if (model) {
        await model.resetHighlight([
          previous.localId,
        ])
      }
    } catch (selectionError) {
      console.warn(
        "[BIM] Failed to reset previous highlight:",
        selectionError
      )
    }

    previousSelectionRef.current = null
  }

  const focusGlobalIdInModel = async (
    globalId: string
  ) => {
    const fragments = fragmentsRef.current

    if (!fragments) return

    for (
      const [modelId, model]
      of fragments.list
    ) {
      const [localId] =
        await model.getLocalIdsByGuids([
          globalId,
        ])

      if (localId === null) continue

      await clearPreviousSelection()

      await model.highlight(
        [localId],
        SELECTION_MATERIAL
      )

      previousSelectionRef.current = {
        modelId,
        localId,
      }

      /*
       * Fly camera to the selected BIM element.
       */
      try {
        const positions =
          await model.getPositions([localId])

        if (positions.length > 0) {
          const target = positions[0]

          const camera =
            cameraRef.current

          if (camera) {
            const distance = 8

            await camera.controls.setLookAt(
              target.x + distance,
              target.y + distance,
              target.z + distance,

              target.x,
              target.y,
              target.z,

              true
            )
          }
        }
      } catch (cameraError) {
        console.warn(
          "[BIM] Could not focus camera on asset:",
          cameraError
        )
      }

      const modelIdMap = {
        [modelId]: [localId],
      }

      const [dataResult, guids] =
        await Promise.all([
          fragments.getData(
            modelIdMap,
            {
              attributesDefault: true,

              relationsDefault: {
                attributes: true,
                relations: false,
              },
            }
          ),

          fragments.modelIdMapToGuids(
            modelIdMap
          ),
        ])

      const normalized =
        normalizeItemData(
          dataResult[modelId]?.[0]
        )

      setSelectedElement({
        modelId,
        localId,
        globalId:
          guids[0] ?? globalId,
        name: getStringValue(
          normalized,
          "Name"
        ),
        ifcClass: getIfcClass(normalized),
        floor: getFloor(normalized),
        data: normalized,
      })

      return
    }

    console.warn(
      `[BIM] GlobalId not found: ${globalId}`
    )
  }

  useEffect(() => {
    if (!focusGlobalId) return

    const loadedCount =
      Object.values(modelStatus).filter(
        (status) => status === "loaded"
      ).length

    if (loadedCount < BIM_MODELS.length) {
      return
    }

    void focusGlobalIdInModel(
      focusGlobalId
    )
  }, [focusGlobalId, modelStatus])

  useEffect(() => {
    const loadedCount =
      Object.values(modelStatus).filter(
        (status) => status === "loaded"
      ).length

    if (
      loadedCount < BIM_MODELS.length
    ) {
      return
    }

    const applyCriticalHighlights = async () => {
      const fragments = fragmentsRef.current

      if (!fragments) return

      try {
        /*
         * Remove the previous critical-alert style.
         * Do not use resetHighlight() globally because
         * that could interfere with the cyan selection.
         */
        for (const [, model] of fragments.list) {
          await model.resetColor(undefined)
        }

        for (const globalId of criticalGlobalIds) {
          for (const [, model] of fragments.list) {
            const [localId] =
              await model.getLocalIdsByGuids([
                globalId,
              ])

            if (localId === null) continue

            await model.setColor(
              [localId],
              CRITICAL_MATERIAL.color
            )

            break
          }
        }
      } catch (error) {
        console.warn(
          "[BIM] Failed to apply critical alert highlighting:",
          error
        )
      }
    }

    void applyCriticalHighlights()
  }, [criticalGlobalIds, modelStatus])

  /*
   * ELEMENT SELECTION
   */

  const selectElement = async (
    event: PointerEvent
  ) => {
    const fragments =
      fragmentsRef.current

    const camera =
      cameraRef.current

    const renderer =
      rendererRef.current

    if (
      !fragments ||
      !camera ||
      !renderer?.three
    ) {
      return
    }

    const canvas =
      renderer.three.domElement

    const bounds =
      canvas.getBoundingClientRect()

    /*
     * Ignore clicks outside the renderer.
     */
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      return
    }

    /*
     * Convert browser coordinates into
     * normalized device coordinates.
     */
    const mouse = new THREE.Vector2(
      ((event.clientX - bounds.left) /
        bounds.width) *
        2 -
        1,

      -(
        ((event.clientY - bounds.top) /
          bounds.height) *
          2 -
        1
      )
    )

    try {
      const result =
        await fragments.raycast({
          camera: camera.three,
          mouse,
          dom: canvas,
        })

      /*
       * Clicking empty space clears selection.
       */
      if (!result) {
        await clearPreviousSelection()

        setSelectedElement(null)

        return
      }

      const model =
        result.fragments

      const localId =
        result.localId

      /*
       * Find the stable model ID.
       *
       * We intentionally derive this from
       * FragmentsManager.list instead of
       * assuming a property on FragmentsModel.
       */
      let modelId: string | undefined

      for (
        const [id, loadedModel]
        of fragments.list
      ) {
        if (loadedModel === model) {
          modelId = id
          break
        }
      }

      if (!modelId) {
        console.warn(
          "[BIM] Could not determine model ID"
        )

        return
      }

      /*
       * Remove old selection highlight.
       */
      await clearPreviousSelection()

      /*
       * Highlight newly selected item.
       */
      await model.highlight(
        [localId],
        SELECTION_MATERIAL
      )

      previousSelectionRef.current = {
        modelId,
        localId,
      }

      /*
       * Retrieve IFC/BIM data.
       */
      const modelIdMap = {
        [modelId]: [localId],
      }

      const [dataResult, guids] =
        await Promise.all([
          fragments.getData(
            modelIdMap,
            {
              attributesDefault: true,

              relationsDefault: {
                attributes: true,
                relations: false,
              },
            }
          ),

          fragments.modelIdMapToGuids(
            modelIdMap
          ),
        ])

      const itemData =
        dataResult[modelId]?.[0]

      const normalized =
        normalizeItemData(itemData)

      setSelectedElement({
        modelId,
        localId,

        globalId:
          guids[0] ||
          getStringValue(
            normalized,
            "GlobalId"
          ),

        name:
          getStringValue(
            normalized,
            "Name"
          ),

        ifcClass:
          getIfcClass(normalized),

        floor:
          getFloor(normalized),

        data: normalized,
      })
    } catch (selectionError) {
      console.error(
        "[BIM] Element selection failed:",
        selectionError
      )
    }
  }

  /*
   * VIEWER INITIALIZATION
   */

  useEffect(() => {
    const container =
      containerRef.current

    if (!container) return

    let components:
      | OBC.Components
      | null = null

    let disposed = false

    const updateModelStatus = (
      discipline: Discipline,
      value: ModelStatus
    ) => {
      if (disposed) return

      setModelStatus(
        (previous) => ({
          ...previous,
          [discipline]: value,
        })
      )
    }

    const initializeViewer =
      async () => {
        try {
          /*
           * COMPONENT SYSTEM
           */

          components =
            new OBC.Components()

          /*
           * WORLD
           */

          const worlds =
            components.get(
              OBC.Worlds
            )

          const world =
            worlds.create<
              OBC.SimpleScene,
              OBC.OrthoPerspectiveCamera,
              OBC.SimpleRenderer
            >()

          /*
           * SCENE
           */

          world.scene =
            new OBC.SimpleScene(
              components
            )

          world.scene.setup({
            backgroundColor: null,
          })

          /*
           * RENDERER
           */

          world.renderer =
            new OBC.SimpleRenderer(
              components,
              container
            )

          rendererRef.current =
            world.renderer

          /*
           * CAMERA
           */

          world.camera =
            new OBC.OrthoPerspectiveCamera(
              components
            )

          cameraRef.current =
            world.camera

          await world.camera.controls.setLookAt(
            20,
            15,
            20,
            0,
            0,
            0
          )

          /*
           * INITIALIZE
           */

          components.init()

          /*
           * CLICK SELECTION
           *
           * components.init() has now created the
           * underlying Three.js renderer/canvas.
           */
          const renderer =
            rendererRef.current?.three

          if (renderer) {
            const canvas =
              renderer.domElement

            canvas.addEventListener(
              "pointerup",
              selectElement
            )

          } else {
            console.warn(
              "[BIM] Renderer not ready for click binding"
            )
          }

          /*
           * FRAGMENTS
           */

          const fragments =
            components.get(
              OBC.FragmentsManager
            )

          fragmentsRef.current =
            fragments

          const workerURL =
            await OBC.FragmentsManager.getWorker()

          fragments.init(
            workerURL
          )

          /*
           * VISIBILITY MANAGER
           */

          const hider =
            components.get(
              OBC.Hider
            )

          hiderRef.current =
            hider

          /*
           * LOAD DISCIPLINES
           */

          let loadedCount = 0

          for (
            const modelConfig
            of BIM_MODELS
          ) {
            if (disposed) return

            updateModelStatus(
              modelConfig.id,
              "loading"
            )

            try {
              const response =
                await fetch(
                  modelConfig.fragmentUrl
                )

              if (!response.ok) {
                if (
                  response.status ===
                  404
                ) {
                  updateModelStatus(
                    modelConfig.id,
                    "missing"
                  )

                  console.warn(
                    `[BIM] ${modelConfig.name} fragment not found`
                  )

                  continue
                }

                throw new Error(
                  `${response.status} ${response.statusText}`
                )
              }

              const buffer =
                await response.arrayBuffer()

              if (disposed) return

              const model =
  await fragments.core.load(
    buffer,
    {
      modelId: modelConfig.id,
      camera: world.camera.three,
      userData: {
        discipline: modelConfig.id,
        disciplineName: modelConfig.name,
      },
    }
  )

world.scene.three.add(model.object)

/*
 * REGISTER ALL MODEL ITEMS
 */

const allModelItems =
  await model.getLocalIds()

allModelItemsRef.current[
  modelConfig.id
] = allModelItems

/*
 * DISCOVER REAL IFC STOREYS
 */

try {
  const storeyCategories =
    await model.getItemsOfCategories([
      /IFCBUILDINGSTOREY/i,
    ])

  const storeyIds =
    Object.values(
      storeyCategories
    ).flat()

  if (storeyIds.length > 0) {
    const storeyData =
      await model.getItemsData(
        storeyIds
      )

    const discoveredStoreys:
      StoreyInfo[] = []

    for (
      let index = 0;
      index < storeyIds.length;
      index++
    ) {
      const storeyId =
        storeyIds[index]

      const storey =
        storeyData[index]

      const name =
        (storey?.Name as any)?.value ??
        `Storey ${storeyId}`

      const rawElevation =
        (storey?.Elevation as any)?.value

      const elevation =
        typeof rawElevation === "number"
          ? rawElevation
          : null

      const itemIds =
        await model.getItemsChildren([
          storeyId,
        ])

      discoveredStoreys.push({
        discipline: modelConfig.id,
        storeyId,
        name,
        elevation,
        itemIds,
      })
    }

    storeysRef.current.push(
      ...discoveredStoreys
    )

    /*
     * Merge storeys from all disciplines
     * by their actual IFC name.
     */
    const floorMap =
      new Map<string, FloorOption>()

    for (
      const storey
      of storeysRef.current
    ) {
      if (
        !floorMap.has(
          storey.name
        )
      ) {
        floorMap.set(
          storey.name,
          {
            name: storey.name,
            elevation:
              storey.elevation,
          }
        )
      }
    }

    const unifiedFloors =
      [...floorMap.values()].sort(
        (a, b) => {
          if (
            a.elevation === null &&
            b.elevation === null
          ) {
            return a.name.localeCompare(
              b.name
            )
          }

          if (a.elevation === null) {
            return 1
          }

          if (b.elevation === null) {
            return -1
          }

          return (
            a.elevation -
            b.elevation
          )
        }
      )

    if (!disposed) {
      setFloors(
        unifiedFloors
      )
    }
  }
} catch (storeyError) {
  console.error(
    `[BIM] Failed to discover storeys for ${modelConfig.id}:`,
    storeyError
  )
}

updateModelStatus(
  modelConfig.id,
  "loaded"
)

loadedCount++
            } catch (
              modelError
            ) {
              console.error(
                `[BIM] Failed loading ${modelConfig.name}:`,
                modelError
              )

              updateModelStatus(
                modelConfig.id,
                "error"
              )
            }
          }

          if (disposed) return

          setStatus(
            loadedCount === 0
              ? "BIM viewer ready — waiting for office models"
              : `BIM viewer ready — ${loadedCount}/${BIM_MODELS.length} models loaded`
          )
        } catch (
          viewerError
        ) {
          console.error(
            "Failed to initialize BIM viewer:",
            viewerError
          )

          if (disposed) return

          setError(
            viewerError instanceof
              Error
              ? viewerError.message
              : "Failed to initialize BIM viewer"
          )

          setStatus(
            "Initialization failed"
          )
        }
      }

    initializeViewer()

    return () => {
      disposed = true

      /*
       * Remove DOM event listener.
       */
      const renderer =
        rendererRef.current

      if (renderer?.three) {
        renderer.three.domElement
          .removeEventListener(
            "pointerup",
            selectElement
          )
      }

      hiderRef.current = null
      fragmentsRef.current = null
      cameraRef.current = null
      rendererRef.current = null

      if (components) {
        components.dispose()
      }
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">

      {/* 3D RENDERER */}

      <div
        ref={containerRef}
        className="absolute inset-0"
      />

      {/* LEFT CONTROL PANEL */}

      <div className="absolute left-3 top-3 z-10 w-[220px] rounded-lg border border-white/10 bg-black/65 p-2.5 text-white shadow-lg backdrop-blur-md">

        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="truncate text-[10px] font-medium text-slate-300">
            {status}
          </p>
        </div>

        {/* DISCIPLINES */}

        <div className="mb-3 border-b border-white/10 pb-3">

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Disciplines
          </p>

          <div className="grid grid-cols-2 gap-1.5">

            {BIM_MODELS.map(
              (model) => {
                const loaded =
                  modelStatus[
                    model.id
                  ] === "loaded"

                const active =
                  visibility[
                    model.id
                  ]

                return (
                  <button
                    key={
                      model.id
                    }
                    type="button"
                    disabled={
                      !loaded
                    }
                    onClick={() =>
                      toggleDiscipline(
                        model.id
                      )
                    }
                    className={[
                      "rounded-md border px-2 py-1 text-left text-[10px] transition",

                      !loaded
                        ? "cursor-not-allowed border-white/5 bg-white/5 text-slate-600"

                        : active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"

                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
                    ].join(
                      " "
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">

                      <span>
                        {
                          model.name
                        }
                      </span>

                      <span>
                        {!loaded
                          ? "—"
                          : active
                            ? "ON"
                            : "OFF"}
                      </span>

                    </span>
                  </button>
                )
              }
            )}

          </div>
        </div>

        {/* FLOOR SELECTOR */}

        <div className="mb-3 border-b border-white/10 pb-3">

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Floor
          </p>

          <select
            value={selectedFloor}
            disabled={floors.length === 0}
            onChange={(event) =>
              applyFloorFilter(
                event.target.value
              )
            }
            className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-cyan-500/50 disabled:cursor-not-allowed disabled:text-slate-600"
          >
            <option value="all">
              All Floors
            </option>

            {floors.map((floor) => (
              <option
                key={floor.name}
                value={floor.name}
              >
                {floor.name}
                {floor.elevation !== null
                  ? ` (${floor.elevation.toFixed(2)} m)`
                  : ""}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* PROPERTIES PANEL */}

      {selectedElement && (
        <div className="absolute right-3 top-3 z-10 max-h-[calc(100%-24px)] w-[260px] overflow-y-auto rounded-lg border border-white/10 bg-black/75 p-3 text-white shadow-xl backdrop-blur-md">

        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Element Properties
        </p>

        {!selectedElement ? (
          <div className="flex h-[160px] items-center justify-center text-center text-xs leading-5 text-slate-500">
            Select an element in the
            3D model to inspect its
            IFC properties.
          </div>
        ) : (
          <ElementProperties
            element={
              selectedElement
            }
          />
        )}

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="absolute bottom-4 left-4 z-20 max-w-xl rounded-md border border-red-500/40 bg-red-950/90 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

    </div>
  )
}

/*
 * PROPERTIES COMPONENT
 */

function ElementProperties({
  element,
}: {
  element: SelectedElement
}) {
  return (
    <div className="space-y-4">

      <div className="space-y-2">

        <PropertyRow
          label="IFC Class"
          value={
            element.ifcClass
          }
        />

        <PropertyRow
          label="Name"
          value={element.name}
        />

        <PropertyRow
          label="GlobalId"
          value={
            element.globalId
          }
        />

        <PropertyRow
          label="Floor"
          value={element.floor}
        />

        <PropertyRow
          label="Discipline"
          value={
            formatDiscipline(
              element.modelId
            )
          }
        />

        <PropertyRow
          label="Local ID"
          value={String(
            element.localId
          )}
        />

      </div>

      <div className="border-t border-white/10 pt-4">

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          IFC Data
        </p>

        {element.data &&
        Object.keys(
          element.data
        ).length > 0 ? (
          <div className="space-y-2">

            {Object.entries(
              element.data
            )
              .slice(0, 30)
              .map(
                ([
                  key,
                  value,
                ]) => (
                  <PropertyRow
                    key={key}
                    label={key}
                    value={formatValue(
                      value
                    )}
                  />
                )
              )}

          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No additional IFC data
            available.
          </p>
        )}

      </div>

    </div>
  )
}

function PropertyRow({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-2">

      <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="break-words text-xs text-slate-200">
        {value || "—"}
      </p>

    </div>
  )
}

/*
 * MODEL STATUS
 */

function ModelStatusRow({
  name,
  status,
}: {
  name: string
  status: ModelStatus
}) {
  const labels: Record<
    ModelStatus,
    string
  > = {
    loading: "Loading",
    loaded: "Loaded",
    missing:
      "Waiting for model",
    error: "Error",
  }

  return (
    <div className="flex items-center justify-between gap-5 text-xs">

      <span className="text-slate-300">
        {name}
      </span>

      <span
        className={
          status === "loaded"
            ? "text-emerald-400"

            : status ===
                "error"
              ? "text-red-400"

              : status ===
                  "missing"
                ? "text-amber-400"

                : "text-blue-400"
        }
      >
        {labels[status]}
      </span>

    </div>
  )
}

/*
 * DATA NORMALIZATION
 *
 * ItemData is intentionally generic in
 * @thatopen/fragments, so we normalize
 * attributes into displayable values.
 */

function normalizeItemData(
  data: unknown
): Record<string, unknown> {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return {}
  }

  const result:
    Record<string, unknown> = {}

  for (const [key, value] of
    Object.entries(
      data as Record<
        string,
        unknown
      >
    )) {
    result[key] =
      normalizeValue(value)
  }

  return result
}

function normalizeValue(
  value: unknown,
  seen = new WeakSet<object>(),
  depth = 0
): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }

  // Prevent pathological IFC relation graphs.
  if (depth > 8) {
    return "[Nested BIM data]"
  }

  if (typeof value !== "object") {
    return String(value)
  }

  const objectValue = value as object

  if (seen.has(objectValue)) {
    return "[Circular]"
  }

  seen.add(objectValue)

  if (Array.isArray(value)) {
    return value.map((item) =>
      normalizeValue(
        item,
        seen,
        depth + 1
      )
    )
  }

  const record =
    value as Record<string, unknown>

  /*
   * IFC attributes commonly use:
   * { value: ... }
   */
  if (
    "value" in record &&
    Object.keys(record).length <= 4
  ) {
    return normalizeValue(
      record.value,
      seen,
      depth + 1
    )
  }

  const result:
    Record<string, unknown> = {}

  for (
    const [key, child] of
    Object.entries(record)
  ) {
    result[key] =
      normalizeValue(
        child,
        seen,
        depth + 1
      )
  }

  return result
}

function getStringValue(
  data: Record<
    string,
    unknown
  >,
  key: string
): string | undefined {
  const direct =
    data[key]

  if (
    typeof direct === "string"
  ) {
    return direct
  }

  if (
    typeof direct === "number"
  ) {
    return String(direct)
  }

  /*
   * Case-insensitive fallback.
   */
  const found =
    Object.entries(data).find(
      ([candidate]) =>
        candidate.toLowerCase() ===
        key.toLowerCase()
    )

  if (!found) {
    return undefined
  }

  const value = found[1]

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value)
  }

  return undefined
}

function getIfcClass(
  data: Record<
    string,
    unknown
  >
): string | undefined {
  return (
    getStringValue(
      data,
      "type"
    ) ||
    getStringValue(
      data,
      "category"
    ) ||
    getStringValue(
      data,
      "class"
    ) ||
    getStringValue(
      data,
      "ifcClass"
    )
  )
}

function getFloor(
  data: Record<
    string,
    unknown
  >
): string | undefined {
  return (
    getStringValue(
      data,
      "floor"
    ) ||
    getStringValue(
      data,
      "storey"
    ) ||
    getStringValue(
      data,
      "level"
    )
  )
}

function formatDiscipline(
  modelId: string
) {
  return (
    BIM_MODELS.find(
      (model) =>
        model.id === modelId
    )?.name || modelId
  )
}

function formatValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "—"
  }

  if (
    typeof value === "string"
  ) {
    return value
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
    
  }

  try {
    return JSON.stringify(
      value
    )
  } catch {
    return String(value)
  }
}