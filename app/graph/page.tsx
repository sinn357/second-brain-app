'use client'

import { useEffect, useRef, useState } from 'react'
import { useGraph } from '@/lib/hooks/useGraph'
import { Skeleton } from '@/components/ui/skeleton'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'

// 폴더별 색상 팔레트
const FOLDER_COLORS = [
  '#4F46E5', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo-500
]

const ISOLATED_NODE_COLOR = '#9CA3AF' // gray-400
const DEFAULT_NODE_COLOR = '#4F46E5' // indigo-600

export default function GraphPage() {
  const { data: graphData, isLoading, error } = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [showIsolated, setShowIsolated] = useState(true)

  // 컨테이너 크기 감지 (반응형)
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        setDimensions({
          width: Math.max(width, 600),
          height: Math.max(width * 0.6, 400),
        })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!graphData || !svgRef.current) return

    const { nodes, edges, folders } = graphData
    const { width, height } = dimensions

    // 폴더 ID → 색상 매핑
    const folderColorMap = new Map<string, string>()
    folders.forEach((folder, idx) => {
      folderColorMap.set(folder.id, FOLDER_COLORS[idx % FOLDER_COLORS.length])
    })

    // 고립 노드 탐지 (edges에 없는 노드)
    const connectedNodeIds = new Set<string>()
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })

    // 필터링된 노드
    let filteredNodes = nodes
    if (selectedFolders.size > 0) {
      filteredNodes = nodes.filter((n) =>
        n.folderId && selectedFolders.has(n.folderId)
      )
    }
    if (!showIsolated) {
      filteredNodes = filteredNodes.filter((n) => connectedNodeIds.has(n.id))
    }

    // 필터링된 노드 ID 집합
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))

    // 필터링된 엣지 (양쪽 노드가 모두 필터링된 노드에 포함)
    const filteredEdges = edges.filter((e) =>
      filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    )

    // 노드 색상 결정 함수
    const getNodeColor = (node: any) => {
      if (!connectedNodeIds.has(node.id)) return ISOLATED_NODE_COLOR
      if (node.folderId) return folderColorMap.get(node.folderId) || DEFAULT_NODE_COLOR
      return DEFAULT_NODE_COLOR
    }

    // SVG 초기화
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g')

    // Zoom 설정
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Force simulation
    const simulation = d3
      .forceSimulation(filteredNodes as any)
      .force(
        'link',
        d3
          .forceLink(filteredEdges)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Links (edges)
    const link = g
      .append('g')
      .selectAll('line')
      .data(filteredEdges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)

    // Nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(filteredNodes)
      .enter()
      .append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        router.push(`/notes/${d.id}`)
      })
      .call(
        d3.drag<any, any>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Labels
    const label = g
      .append('g')
      .selectAll('text')
      .data(filteredNodes)
      .enter()
      .append('text')
      .text((d: any) => d.title)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .attr('fill', '#1F2937')
      .attr('class', 'dark:fill-indigo-100')

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y)
    })

    return () => {
      simulation.stop()
    }
  }, [graphData, router, dimensions, selectedFolders, showIsolated])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6 flex items-center justify-center">
        <Skeleton className="w-full h-[800px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <div className="bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!graphData) return null

  const { folders, nodes, edges } = graphData

  // 폴더별 색상 매핑 (레전드용)
  const folderColorMap = new Map<string, string>()
  folders.forEach((folder, idx) => {
    folderColorMap.set(folder.id, FOLDER_COLORS[idx % FOLDER_COLORS.length])
  })

  // 고립 노드 개수
  const connectedNodeIds = new Set<string>()
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })
  const isolatedCount = nodes.filter((n) => !connectedNodeIds.has(n.id)).length

  // 폴더 필터 토글
  const toggleFolder = (folderId: string) => {
    const newSet = new Set(selectedFolders)
    if (newSet.has(folderId)) {
      newSet.delete(folderId)
    } else {
      newSet.add(folderId)
    }
    setSelectedFolders(newSet)
  }

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
      <div className="bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">Graph View</h1>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
          노트를 클릭하면 해당 노트로 이동합니다. 드래그로 노드를 이동할 수 있습니다.
        </p>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">Filters:</div>
          <div className="flex flex-wrap gap-2">
            {folders.map((folder) => (
              <label
                key={folder.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFolders.has(folder.id)}
                  onChange={() => toggleFolder(folder.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: folderColorMap.get(folder.id) }}
                />
                <span className="text-sm text-indigo-700 dark:text-indigo-300">{folder.name}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors">
              <input
                type="checkbox"
                checked={showIsolated}
                onChange={(e) => setShowIsolated(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-indigo-700 dark:text-indigo-300">
                Show Isolated Nodes ({isolatedCount})
              </span>
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm border-t border-indigo-200 dark:border-indigo-700 pt-4">
          <div className="font-semibold text-indigo-900 dark:text-indigo-100">Legend:</div>
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: folderColorMap.get(folder.id) }}
              />
              <span className="text-indigo-700 dark:text-indigo-300">{folder.name}</span>
            </div>
          ))}
          {isolatedCount > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: ISOLATED_NODE_COLOR }}
              />
              <span className="text-gray-600 dark:text-gray-400">Isolated</span>
            </div>
          )}
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full border border-indigo-200 dark:border-indigo-700 rounded" />
        </div>
      </div>
    </div>
  )
}
