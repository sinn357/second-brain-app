'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useGraph } from '@/lib/hooks/useGraph'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TreeNode = {
  id: string
  title: string
  children?: TreeNode[]
}

export default function MindmapPage() {
  const { data: graphData, isLoading, error } = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 })
  const [rootId, setRootId] = useState<string | null>(null)
  const [depthLimit, setDepthLimit] = useState(3)

  const nodeMap = useMemo(() => {
    if (!graphData) return new Map<string, { title: string }>()
    return new Map(graphData.nodes.map((node) => [node.id, { title: node.title }]))
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
      setRootId(graphData.nodes[0].id)
    }
  }, [graphData, rootId])

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
    if (!graphData || !svgRef.current || !rootId) return

    const visited = new Set<string>([rootId])

    const buildTree = (id: string, depth: number): TreeNode => {
      const title = nodeMap.get(id)?.title ?? 'Untitled'
      if (depth >= depthLimit) {
        return { id, title }
      }

      const neighbors = Array.from(adjacency.get(id) ?? [])
      const children: TreeNode[] = []

      for (const childId of neighbors) {
        if (visited.has(childId)) continue
        visited.add(childId)
        children.push(buildTree(childId, depth + 1))
      }

      return children.length > 0 ? { id, title, children } : { id, title }
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
      .on('click', (_, d) => setRootId(d.data.id))

    node
      .append('circle')
      .attr('r', (d) => (d.depth === 0 ? 10 : 7))
      .attr('fill', (d) => (d.depth === 0 ? '#6366f1' : '#a5b4fc'))
      .attr('stroke', isDark ? '#0f172a' : '#1f2937')
      .attr('stroke-width', 1)

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
  }, [graphData, rootId, depthLimit, adjacency, nodeMap, dimensions])

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <Skeleton className="h-12 mb-6" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <div className="panel p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="dark:text-indigo-100">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <div className="panel p-6 text-center text-indigo-600 dark:text-indigo-300">
            노트가 없습니다. 먼저 노트를 생성하세요.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="panel p-6 space-y-4">
          <div className="page-header">
            <div>
              <h1 className="page-title text-indigo-900 dark:text-indigo-100">Mindmap View</h1>
              <p className="page-subtitle">선택한 노트를 중심으로 연결 구조를 트리 형태로 확인합니다.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-indigo-600 dark:text-indigo-300">Root</span>
              <Select value={rootId ?? ''} onValueChange={(value) => setRootId(value)}>
                <SelectTrigger className="w-64 text-sm">
                  <SelectValue placeholder="Select note" />
                </SelectTrigger>
                <SelectContent>
                  {graphData.nodes.map((node) => (
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

          <div ref={containerRef} className="w-full">
            <svg ref={svgRef} className="w-full rounded-lg border border-indigo-200 dark:border-indigo-700" />
          </div>
        </div>
      </div>
    </div>
  )
}
