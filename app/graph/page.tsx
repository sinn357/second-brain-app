'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGraph, type SimulationNode, type SimulationLink } from '@/lib/hooks/useGraph'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'
import { useCreateNote } from '@/lib/hooks/useNotes'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
const MISSING_NODE_COLOR = '#D1D5DB' // gray-300

// 성능 임계값
const LARGE_GRAPH_THRESHOLD = 100
const MAX_VISIBLE_LABELS = 50

export default function GraphPage() {
  const { data: graphData, isLoading, error } = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  const createNote = useCreateNote()
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [layout, setLayout] = useState<'network' | 'tree'>('network')
  const [rootId, setRootId] = useState<string | null>(null)
  const [depthLimit, setDepthLimit] = useState(3)
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [showIsolated, setShowIsolated] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [limitNodes, setLimitNodes] = useState(false)
  const [showMissing, setShowMissing] = useState(true)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: SimulationNode
  } | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const nodeMap = useMemo(() => {
    if (!graphData) return new Map<string, { title: string; isMissing: boolean }>()
    return new Map(graphData.nodes.map((node) => [node.id, { title: node.title, isMissing: node.isMissing }]))
  }, [graphData])

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>()
    if (!graphData) return map
    graphData.edges.forEach((edge) => {
      if (!map.has(edge.source)) map.set(edge.source, new Set())
      if (!map.has(edge.target)) map.set(edge.target, new Set())
      map.get(edge.source)!.add(edge.target)
      map.get(edge.target)!.add(edge.source)
    })
    return map
  }, [graphData])

  useEffect(() => {
    if (!graphData) return
    if (rootId) return
    if (graphData.nodes.length > 0) {
      const latestId = graphData.latestUpdatedNoteId
      const fallbackId = graphData.nodes.find((node) => !node.isMissing)?.id
      setRootId(latestId ?? fallbackId ?? graphData.nodes[0].id)
    }
  }, [graphData, rootId])

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
    const handleClose = () => setContextMenu(null)
    window.addEventListener('click', handleClose)
    return () => window.removeEventListener('click', handleClose)
  }, [])

  const filteredGraph = useMemo(() => {
    if (!graphData) return null
    const { nodes, edges } = graphData

    // 고립 노드 탐지 (edges에 없는 노드)
    const connectedNodeIds = new Set<string>()
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })

    let filteredNodes = nodes
    if (!showMissing) {
      filteredNodes = filteredNodes.filter((n) => !n.isMissing)
    }
    if (selectedFolders.size > 0) {
      filteredNodes = filteredNodes.filter((n) =>
        n.folderId && selectedFolders.has(n.folderId)
      )
    }
    if (!showIsolated) {
      filteredNodes = filteredNodes.filter((n) => connectedNodeIds.has(n.id))
    }

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = edges.filter((e) =>
      filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    )

    return { filteredNodes, filteredEdges, connectedNodeIds }
  }, [graphData, selectedFolders, showIsolated, showMissing])

  const treeNodeIds = useMemo(() => {
    if (!graphData) return new Set<string>()
    const nodes = showMissing ? graphData.nodes : graphData.nodes.filter((n) => !n.isMissing)
    return new Set(nodes.map((node) => node.id))
  }, [graphData, showMissing])

  useEffect(() => {
    if (!graphData || !svgRef.current) return
    if (layout !== 'network') return

    const { folders } = graphData
    const { width, height } = dimensions

    // 폴더 ID → 색상 매핑
    const folderColorMap = new Map<string, string>()
    folders.forEach((folder, idx) => {
      folderColorMap.set(folder.id, FOLDER_COLORS[idx % FOLDER_COLORS.length])
    })

    const filteredNodes = filteredGraph?.filteredNodes ?? []
    const filteredEdges = filteredGraph?.filteredEdges ?? []
    const connectedNodeIds = filteredGraph?.connectedNodeIds ?? new Set<string>()

    // 노드 색상 결정 함수
    const getNodeColor = (node: SimulationNode) => {
      if (node.isMissing) return MISSING_NODE_COLOR
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

    // Force simulation - 성능 최적화
    const simulationNodes = filteredNodes as SimulationNode[]
    const simulationLinks = filteredEdges.map(e => ({ ...e })) as SimulationLink[]

    const isLargeGraph = simulationNodes.length > LARGE_GRAPH_THRESHOLD

    // 대규모 그래프에서 노드 제한 (상위 연결 노드만)
    let finalNodes = simulationNodes
    let finalLinks = simulationLinks

    if (limitNodes && isLargeGraph) {
      // 연결 수로 정렬하여 상위 노드만 선택
      const connectionCount = new Map<string, number>()
      simulationLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        connectionCount.set(sourceId, (connectionCount.get(sourceId) || 0) + 1)
        connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1)
      })

      finalNodes = [...simulationNodes]
        .sort((a, b) => (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0))
        .slice(0, LARGE_GRAPH_THRESHOLD)

      const nodeIdSet = new Set(finalNodes.map(n => n.id))
      finalLinks = simulationLinks.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        return nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)
      })
    }

    const simulation = d3
      .forceSimulation<SimulationNode>(finalNodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(finalLinks)
          .id((d) => d.id)
          .distance(isLargeGraph ? 80 : 100)
      )
      .force('charge', d3.forceManyBody().strength(isLargeGraph ? -150 : -300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(isLargeGraph ? 20 : 30))
      // 성능 최적화: 빠른 수렴
      .alphaDecay(isLargeGraph ? 0.05 : 0.0228)
      .velocityDecay(isLargeGraph ? 0.6 : 0.4)

    // Links (edges)
    const link = g
      .append('g')
      .selectAll('line')
      .data(finalLinks)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', isLargeGraph ? 1 : 2)

    // Nodes
    const node = g
      .append('g')
      .selectAll<SVGCircleElement, SimulationNode>('circle')
      .data(finalNodes)
      .enter()
      .append('circle')
      .attr('r', isLargeGraph ? 6 : 8)
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', (d) => (d.isMissing ? '#9CA3AF' : '#fff'))
      .attr('stroke-width', isLargeGraph ? 1 : 2)
      .attr('stroke-dasharray', (d) => (d.isMissing ? '4,3' : null))
      .style('cursor', (d) => (d.isMissing ? 'default' : 'pointer'))
      .on('click', (_, d) => {
        if (longPressTriggeredRef.current) {
          longPressTriggeredRef.current = false
          return
        }
        if (d.isMissing) return
        router.push(`/notes?noteId=${d.id}`)
      })
      .on('pointerdown', (event, d) => {
        if (event.pointerType !== 'touch') return
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = window.setTimeout(() => {
          longPressTriggeredRef.current = true
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            node: d,
          })
        }, 600)
      })
      .on('pointerup', () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      })
      .on('pointerleave', () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      })
      .on('pointercancel', () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault()
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          node: d,
        })
      })
      .call(
        d3.drag<SVGCircleElement, SimulationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Labels - 성능 최적화: 대규모 그래프에서 hover 시만 표시
    const shouldShowLabel = showLabels && finalNodes.length <= MAX_VISIBLE_LABELS

    // 항상 레이블 요소 생성 (hover 표시용)
    const label = g
      .append('g')
      .selectAll<SVGTextElement, SimulationNode>('text')
      .data(finalNodes)
      .enter()
      .append('text')
      .text((d) => d.title)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .style('opacity', shouldShowLabel ? 1 : 0)
      .attr('fill', '#1F2937')
      .attr('class', 'dark:fill-indigo-100')

    // Hover 시 레이블 표시 (대규모 그래프)
    if (!shouldShowLabel) {
      node
        .on('mouseenter', function(event, d) {
          const index = finalNodes.indexOf(d)
          label.filter((_, i) => i === index).style('opacity', 1)
          d3.select(this).attr('r', isLargeGraph ? 10 : 12)
        })
        .on('mouseleave', function(event, d) {
          const index = finalNodes.indexOf(d)
          label.filter((_, i) => i === index).style('opacity', 0)
          d3.select(this).attr('r', isLargeGraph ? 6 : 8)
        })
    }

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimulationNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimulationNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimulationNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimulationNode).y ?? 0)

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)

      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    })

    return () => {
      simulation.stop()
    }
  }, [graphData, router, dimensions, selectedFolders, showIsolated, showLabels, limitNodes, showMissing, layout, filteredGraph])

  useEffect(() => {
    if (!graphData || !svgRef.current || !rootId) return
    if (layout !== 'tree') return

    const allowedNodeIds = treeNodeIds
    const visited = new Set<string>([rootId])

    type TreeNode = {
      id: string
      title: string
      isMissing: boolean
      children?: TreeNode[]
    }

    const buildTree = (id: string, depth: number): TreeNode => {
      const nodeMeta = nodeMap.get(id)
      const title = nodeMeta?.title ?? 'Untitled'
      const isMissing = nodeMeta?.isMissing ?? false

      if (depth >= depthLimit) {
        return { id, title, isMissing }
      }

      const neighbors = Array.from(adjacency.get(id) ?? [])
        .filter((neighborId) => allowedNodeIds.has(neighborId))

      const children: TreeNode[] = []

      for (const childId of neighbors) {
        if (visited.has(childId)) continue
        visited.add(childId)
        children.push(buildTree(childId, depth + 1))
      }

      return children.length > 0 ? { id, title, isMissing, children } : { id, title, isMissing }
    }

    const treeData = buildTree(rootId, 0)
    const root = d3.hierarchy(treeData)

    const { width, height } = dimensions
    const isDark = document.documentElement.classList.contains('dark')
    const treeLayout = d3.tree<TreeNode>().size([height - 80, width - 160])
    treeLayout(root)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', 'translate(80,40)')

    const linkGenerator = d3
      .linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
      .x((d) => d.y)
      .y((d) => d.x)

    const links = root.links() as d3.HierarchyPointLink<TreeNode>[]

    g.append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', (d) => linkGenerator(d) ?? '')
      .attr('fill', 'none')
      .attr('stroke', isDark ? '#64748b' : '#94a3b8')
      .attr('stroke-width', 1.5)

    const node = g
      .append('g')
      .selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        if (longPressTriggeredRef.current) {
          longPressTriggeredRef.current = false
          return
        }
        if (d.data.isMissing) return
        router.push(`/notes?noteId=${d.data.id}`)
      })
      .on('pointerdown', (event, d) => {
        if (event.pointerType !== 'touch') return
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = window.setTimeout(() => {
          longPressTriggeredRef.current = true
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            node: d.data as SimulationNode,
          })
        }, 600)
      })
      .on('pointerup', () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      })
      .on('pointerleave', () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      })
      .on('pointercancel', () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault()
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          node: d.data as SimulationNode,
        })
      })

    node
      .append('circle')
      .attr('r', (d) => (d.depth === 0 ? 10 : 7))
      .attr('fill', (d) => (d.data.isMissing ? MISSING_NODE_COLOR : d.depth === 0 ? '#6366f1' : '#a5b4fc'))
      .attr('stroke', isDark ? '#0f172a' : '#1f2937')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', (d) => (d.data.isMissing ? '4,3' : null))

    if (showLabels) {
      node
        .append('text')
        .attr('x', (d) => (d.children ? -12 : 12))
        .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
        .attr('font-size', 12)
        .attr('fill', isDark ? '#e2e8f0' : '#1f2937')
        .text((d) => d.data.title)
        .clone(true)
        .lower()
        .attr('stroke', isDark ? '#0f172a' : 'white')
        .attr('stroke-width', 3)
    }
  }, [graphData, rootId, depthLimit, adjacency, nodeMap, dimensions, layout, filteredGraph, showLabels, treeNodeIds])

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <Skeleton className="w-full h-[800px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-content">
        <div className="panel p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류</h1>
          <p className="dark:text-indigo-100">그래프를 불러오는데 실패했습니다: {error.message}</p>
        </div>
        </div>
      </div>
    )
  }

  if (!graphData) return null

  const { folders, nodes, edges, unresolved } = graphData

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
  const isolatedCount = nodes.filter((n) => !n.isMissing && !connectedNodeIds.has(n.id)).length
  const missingCount = unresolved.length

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

  const handleCreateMissing = async (title: string) => {
    try {
      const note = await createNote.mutateAsync({
        title,
        body: '',
        folderId: null,
      })
      await queryClient.invalidateQueries({ queryKey: ['graph'] })
      router.push(`/notes?noteId=${note.id}`)
    } catch (error) {
      console.error('Create missing note error:', error)
      toast.error('노트 생성에 실패했습니다')
    }
  }

  const handleSetRoot = (nodeId: string) => {
    setLayout('tree')
    setRootId(nodeId)
    setContextMenu(null)
  }

  return (
    <div className="page-shell">
      <div className="page-content">
      <div className="panel p-6">
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100">Graph View</h1>
            <p className="page-subtitle">
              노트를 클릭하면 해당 노트로 이동합니다. 드래그로 노드를 이동할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={layout === 'network' ? 'default' : 'outline'}
              onClick={() => setLayout('network')}
            >
              Network
            </Button>
            <Button
              size="sm"
              variant={layout === 'tree' ? 'default' : 'outline'}
              onClick={() => setLayout('tree')}
            >
              Tree
            </Button>
          </div>
        </div>

        {layout === 'tree' ? (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-indigo-600 dark:text-indigo-300">Root</span>
              <Select value={rootId ?? ''} onValueChange={(value) => setRootId(value)}>
                <SelectTrigger className="w-64 text-sm">
                  <SelectValue placeholder="Select note" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-indigo-600 dark:text-indigo-300">Depth</span>
              <input
                type="range"
                min={1}
                max={5}
                value={depthLimit}
                onChange={(event) => setDepthLimit(Number(event.target.value))}
                className="w-32"
              />
              <span className="toolbar-pill">{depthLimit}</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            <div className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">Filters:</div>
            <div className="flex flex-wrap gap-2">
              {folders.map((folder) => (
                <label
                  key={folder.id}
                  className="panel-soft flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors"
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
            <div className="flex flex-wrap items-center gap-2">
              <label className="panel-soft flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors">
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
              <label className="panel-soft flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors">
                <input
                  type="checkbox"
                  checked={showMissing}
                  onChange={(e) => setShowMissing(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-indigo-700 dark:text-indigo-300">
                  Show Missing Links ({missingCount})
                </span>
              </label>
              <label className="panel-soft flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-indigo-700 dark:text-indigo-300">
                  Show Labels
                </span>
              </label>
              {nodes.length > LARGE_GRAPH_THRESHOLD && (
                <label className="panel-soft flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={limitNodes}
                    onChange={(e) => setLimitNodes(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-indigo-700 dark:text-indigo-300">
                    Limit to Top {LARGE_GRAPH_THRESHOLD} Nodes
                  </span>
                </label>
              )}
            </div>
            {/* 대규모 그래프 경고 */}
            {nodes.length > LARGE_GRAPH_THRESHOLD && !limitNodes && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ 노드가 많아 성능이 저하될 수 있습니다 ({nodes.length}개).
                레이블이 자동으로 숨겨지며 hover 시 표시됩니다.
              </div>
            )}
          </div>
        )}

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
          {missingCount > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-dashed border-gray-400"
                style={{ backgroundColor: MISSING_NODE_COLOR }}
              />
              <span className="text-gray-600 dark:text-gray-400">Missing Link</span>
            </div>
          )}
        </div>

        {/* Missing Links */}
        <div className="mb-6">
          <div className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm mb-2">
            Uncreated Links ({missingCount})
          </div>
          {missingCount === 0 ? (
            <div className="text-sm text-indigo-500 dark:text-indigo-300">
              모두 생성되었습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {unresolved.map((entry) => {
                const sourcePreview = entry.sources.slice(0, 3).map((source) => source.title).join(', ')
                const remainder = entry.sources.length - 3
                return (
                  <div
                    key={entry.title}
                    className="panel-soft flex items-center justify-between gap-4 px-4 py-3 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        {entry.title}
                      </div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-300">
                        {entry.sources.length} sources
                        {sourcePreview && ` · ${sourcePreview}`}
                        {remainder > 0 && ` +${remainder} more`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateMissing(entry.title)}
                    >
                      Create
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="w-full overflow-hidden rounded-lg">
          <svg
            ref={svgRef}
            className="w-full border border-indigo-200 dark:border-indigo-700 rounded-lg touch-none select-none"
          />
        </div>

        {contextMenu && (
          <div
            className="fixed z-50 w-48 rounded-md border border-indigo-200 bg-white shadow-lg dark:border-indigo-700 dark:bg-indigo-900"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm text-indigo-900 hover:bg-indigo-50 dark:text-indigo-100 dark:hover:bg-indigo-800"
              onClick={() => handleSetRoot(contextMenu.node.id)}
            >
              루트로 설정
            </button>
            {contextMenu.node.isMissing && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-indigo-900 hover:bg-indigo-50 dark:text-indigo-100 dark:hover:bg-indigo-800"
                onClick={() => {
                  handleCreateMissing(contextMenu.node.title)
                  setContextMenu(null)
                }}
              >
                노트 생성
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
