import { useCallback, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { mesh } from 'topojson-client'
import { Maximize2, Minus, Plus } from 'lucide-react'
import type { Geography, MunicipalityFeature } from '../types/geography'
import { CHF, colorIndex } from '../lib/tax'

const WIDTH = 960
const HEIGHT = 600
const MAP_FRAME: [[number, number], [number, number]] = [[38, 24], [922, 566]]
const MAP_COLORS = ['#D8EBE5', '#A9D4C8', '#78B8A6', '#E9C46A', '#E76F51']
const CITY_LABELS = [
  { name: 'Basel', canton: 'BS', coordinates: [7.5886, 47.5596] as [number, number], dx: -6, dy: -9 },
  { name: 'Zürich', canton: 'ZH', coordinates: [8.5417, 47.3769] as [number, number], dx: 9, dy: -8 },
  { name: 'Bern', canton: 'BE', coordinates: [7.4474, 46.948] as [number, number], dx: -29, dy: 17 },
  { name: 'St. Gallen', canton: 'SG', coordinates: [9.3767, 47.4245] as [number, number], dx: 9, dy: -8 },
  { name: 'Genève', canton: 'GE', coordinates: [6.1432, 46.2044] as [number, number], dx: -8, dy: 18 },
  { name: 'Lugano', canton: 'TI', coordinates: [8.9511, 46.0037] as [number, number], dx: 9, dy: 18 },
]

interface ViewTransform { k: number; x: number; y: number }
interface TooltipState { id: number; x: number; y: number }
interface Point { x: number; y: number }
interface DragState { pointerId: number; startX: number; startY: number; view: ViewTransform; targetId: number | null }
interface PinchState { distance: number; midpoint: Point; view: ViewTransform }
type GeoBounds = [[number, number], [number, number]]

function constrainView(view: ViewTransform, countryBounds: GeoBounds): ViewTransform {
  const k = Math.max(1, Math.min(12, view.k))
  if (k === 1) return { k: 1, x: 0, y: 0 }
  const [[frameLeft, frameTop], [frameRight, frameBottom]] = MAP_FRAME
  const [[x0, y0], [x1, y1]] = countryBounds
  const minX = frameRight - k * x1
  const maxX = frameLeft - k * x0
  const minY = frameBottom - k * y1
  const maxY = frameTop - k * y0
  return {
    k,
    x: Math.max(minX, Math.min(maxX, view.x)),
    y: Math.max(minY, Math.min(maxY, view.y)),
  }
}

interface SwissMapProps {
  geography: Geography
  values: Map<number, number>
  breaks: number[]
  selectedCanton: string
  activeId: number | null
  hoveredId: number | null
  pinnedIds: Set<number>
  onHover: (id: number | null) => void
  onSelect: (id: number) => void
}

export default function SwissMap({
  geography, values, breaks, selectedCanton, activeId, hoveredId, pinnedIds, onHover, onSelect,
}: SwissMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const activePointers = useRef<Map<number, Point>>(new Map())
  const dragRef = useRef<DragState | null>(null)
  const pinchRef = useRef<PinchState | null>(null)
  const movedRef = useRef(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const { path, municipalityPaths, cantonBoundary, countryBoundary, countryBounds, lakePaths, cities, featureById } = useMemo(() => {
    const projection = geoMercator().fitExtent(MAP_FRAME, geography.country)
    const geoPathBuilder = geoPath(projection)
    const byId = new Map<number, MunicipalityFeature>()
    const paths = geography.municipalities.map(feature => {
      byId.set(feature.properties.bfsId, feature)
      return { feature, d: geoPathBuilder(feature) ?? '' }
    })
    const cantonMesh = mesh(geography.topology, geography.topology.objects.cantons, (a, b) => a !== b)
    const countryMesh = mesh(geography.topology, geography.topology.objects.country, (a, b) => a === b)
    return {
      path: geoPathBuilder,
      municipalityPaths: paths,
      cantonBoundary: geoPathBuilder(cantonMesh) ?? '',
      countryBoundary: geoPathBuilder(countryMesh) ?? '',
      countryBounds: geoPathBuilder.bounds(geography.country),
      lakePaths: geography.lakes.map(lake => geoPathBuilder(lake) ?? ''),
      cities: CITY_LABELS.map(city => ({ ...city, point: projection(city.coordinates) })),
      featureById: byId,
    }
  }, [geography])

  const getRestingView = useCallback((): ViewTransform => {
    if (!selectedCanton) return { k: 1, x: 0, y: 0 }
    const canton = geography.cantons.find(item => item.properties.abbr === selectedCanton)
    if (!canton) return { k: 1, x: 0, y: 0 }
    const [[x0, y0], [x1, y1]] = path.bounds(canton)
    const k = Math.max(1, Math.min(8, 0.72 / Math.max((x1 - x0) / WIDTH, (y1 - y0) / HEIGHT)))
    return constrainView({ k, x: WIDTH / 2 - k * (x0 + x1) / 2, y: HEIGHT / 2 - k * (y0 + y1) / 2 }, countryBounds)
  }, [countryBounds, geography.cantons, path, selectedCanton])
  const [view, setView] = useState<ViewTransform>(getRestingView)
  const resetView = useCallback(() => { setView(getRestingView()) }, [getRestingView])

  const zoom = useCallback((factor: number) => {
    setView(current => {
      const k = Math.max(1, Math.min(12, current.k * factor))
      const applied = k / current.k
      return constrainView({
        k,
        x: WIDTH / 2 - (WIDTH / 2 - current.x) * applied,
        y: HEIGHT / 2 - (HEIGHT / 2 - current.y) * applied,
      }, countryBounds)
    })
  }, [countryBounds])

  const markers = useMemo(() => {
    const ids = new Set(pinnedIds)
    if (activeId) ids.add(activeId)
    return [...ids].map(id => {
      const feature = featureById.get(id)
      return feature ? { id, point: path.centroid(feature), active: id === activeId } : null
    }).filter(Boolean) as { id: number; point: [number, number]; active: boolean }[]
  }, [activeId, featureById, path, pinnedIds])

  const activeTooltip = tooltip ? featureById.get(tooltip.id) : null
  const tooltipValue = tooltip ? values.get(tooltip.id) : null

  function updateTooltip(event: React.PointerEvent<SVGPathElement>, id: number) {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return
    const x = Math.max(8, Math.min(event.clientX - bounds.left + 14, bounds.width - 190))
    setTooltip({ id, x, y: event.clientY - bounds.top })
  }

  function svgPoint(point: Point): Point {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds) return point
    return {
      x: (point.x - bounds.left) * WIDTH / bounds.width,
      y: (point.y - bounds.top) * HEIGHT / bounds.height,
    }
  }

  function pinchGeometry() {
    const points = [...activePointers.current.values()].slice(0, 2).map(svgPoint)
    if (points.length !== 2) return null
    const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    return {
      distance,
      midpoint: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 },
    }
  }

  function startPinch() {
    const geometry = pinchGeometry()
    dragRef.current = null
    pinchRef.current = geometry && geometry.distance > 0
      ? { distance: geometry.distance, midpoint: geometry.midpoint, view }
      : null
    movedRef.current = true
    setTooltip(null)
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointers.current.size === 1) {
      const municipality = (event.target as Element).closest('.municipality-shape')
      const targetId = municipality && !municipality.classList.contains('is-dimmed')
        ? Number(municipality.getAttribute('data-bfs-id'))
        : null
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        view,
        targetId,
      }
      pinchRef.current = null
      movedRef.current = false
    } else if (activePointers.current.size === 2) {
      startPinch()
    }
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!activePointers.current.has(event.pointerId)) return
    event.preventDefault()
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointers.current.size >= 2 && pinchRef.current) {
      const start = pinchRef.current
      const geometry = pinchGeometry()
      if (!geometry || geometry.distance === 0) return
      const k = Math.max(1, Math.min(12, start.view.k * geometry.distance / start.distance))
      const applied = k / start.view.k
      setView(constrainView({
        k,
        x: geometry.midpoint.x - (start.midpoint.x - start.view.x) * applied,
        y: geometry.midpoint.y - (start.midpoint.y - start.view.y) * applied,
      }, countryBounds))
      return
    }

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || activePointers.current.size !== 1) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds || !movedRef.current || drag.view.k <= 1) return
    setTooltip(null)
    setView(constrainView({
      ...drag.view,
      x: drag.view.x + dx * WIDTH / bounds.width,
      y: drag.view.y + dy * HEIGHT / bounds.height,
    }, countryBounds))
  }

  function finishPointer(event: React.PointerEvent<SVGSVGElement>, allowSelection: boolean) {
    if (!activePointers.current.has(event.pointerId)) return
    const drag = dragRef.current
    const wasTap = allowSelection && activePointers.current.size === 1 && !movedRef.current && drag?.pointerId === event.pointerId
    activePointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (wasTap && drag?.targetId) onSelect(drag.targetId)

    if (activePointers.current.size === 1) {
      const [pointerId, point] = [...activePointers.current.entries()][0]
      dragRef.current = { pointerId, startX: point.x, startY: point.y, view, targetId: null }
      pinchRef.current = null
      movedRef.current = true
    } else if (activePointers.current.size >= 2) {
      startPinch()
    } else {
      dragRef.current = null
      pinchRef.current = null
    }
  }

  return (
    <div className="map-visual" ref={containerRef}>
      <div className="map-tools" aria-label="Map zoom controls">
        <button type="button" className="icon-button" onClick={() => zoom(1.35)} disabled={view.k >= 12} aria-label="Zoom in"><Plus size={17} /></button>
        <button type="button" className="icon-button" onClick={() => zoom(1 / 1.35)} disabled={view.k <= 1} aria-label="Zoom out"><Minus size={17} /></button>
        <button type="button" className="icon-button" onClick={resetView} aria-label="Reset map zoom"><Maximize2 size={16} /></button>
      </div>
      <svg
        ref={svgRef}
        className="swiss-map"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Interactive 2026 map of Switzerland with 2,113 municipality and special-area polygons and 26 canton outlines. Use the ranking or search as keyboard alternatives."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={event => finishPointer(event, true)}
        onPointerCancel={event => finishPointer(event, false)}
        onLostPointerCapture={event => finishPointer(event, false)}
        onPointerLeave={() => { if (activePointers.current.size === 0) { setTooltip(null); onHover(null) } }}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <g className="municipality-layer">
            {municipalityPaths.map(({ feature, d }) => {
              const id = feature.properties.bfsId
              const value = values.get(id)
              const dimmed = Boolean(selectedCanton && feature.properties.canton !== selectedCanton)
              const classes = [
                'municipality-shape',
                id === activeId ? 'is-active' : '',
                id === hoveredId ? 'is-hovered' : '',
                pinnedIds.has(id) ? 'is-pinned' : '',
                dimmed ? 'is-dimmed' : '',
              ].filter(Boolean).join(' ')
              return (
                <path
                  key={id}
                  data-bfs-id={id}
                  d={d}
                  className={classes}
                  fill={feature.properties.special ? '#C4D0CC' : MAP_COLORS[colorIndex(value ?? breaks[0], breaks)]}
                  onMouseEnter={event => {
                    if (!dimmed) {
                      onHover(id)
                      updateTooltip(event as unknown as React.PointerEvent<SVGPathElement>, id)
                    }
                  }}
                  onMouseMove={event => {
                    if (!dimmed && !dragRef.current) updateTooltip(event as unknown as React.PointerEvent<SVGPathElement>, id)
                  }}
                  onMouseLeave={() => { setTooltip(null); onHover(null) }}
                />
              )
            })}
          </g>
          <path className="canton-boundary" d={cantonBoundary} vectorEffect="non-scaling-stroke" />
          <g className="lake-layer">{lakePaths.map((d, index) => <path key={index} d={d} vectorEffect="non-scaling-stroke" />)}</g>
          <path className="country-boundary" d={countryBoundary} vectorEffect="non-scaling-stroke" />
          <g className="city-layer">
            {cities.filter(city => !selectedCanton || city.canton === selectedCanton).map(city => city.point && (
              <g key={city.name} transform={`translate(${city.point[0]} ${city.point[1]})`}>
                <circle r={2.5 / view.k} /><text x={city.dx / view.k} y={city.dy / view.k} style={{ fontSize: `${11 / view.k}px`, strokeWidth: `${3 / view.k}px` }}>{city.name}</text>
              </g>
            ))}
          </g>
          <g className="marker-layer">
            {markers.map(marker => (
              <path
                key={marker.id}
                className={marker.active ? 'active-marker' : 'pinned-marker'}
                d={`M${marker.point[0]} ${marker.point[1] - 7 / view.k}l${7 / view.k} ${7 / view.k}-${7 / view.k} ${7 / view.k}-${7 / view.k}-${7 / view.k}Z`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </g>
      </svg>
      {activeTooltip && tooltip && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: Math.max(8, tooltip.y - 68) }}>
          <strong>{activeTooltip.properties.name}</strong>
          <span>{activeTooltip.properties.cantonName} · BFS {activeTooltip.properties.bfsId}</span>
          <b>{activeTooltip.properties.special ? 'Special area · not ranked' : `Estimated income tax ${CHF.format(tooltipValue ?? 0)} CHF`}</b>
        </div>
      )}
      <div className="map-legend" aria-label="Estimated ESTV 2026 income tax colour legend">
        <span>Lower tax</span>
        <div className="legend-swatches">{MAP_COLORS.map(color => <i key={color} style={{ background: color }} />)}</div>
        <span>Higher tax</span>
        <b>{CHF.format(breaks[0] ?? 0)}–{CHF.format(breaks[5] ?? 0)} CHF</b>
      </div>
    </div>
  )
}
