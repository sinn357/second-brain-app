'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'

interface LocalGraphLink {
  id: string
  title: string
  direction: 'outgoing' | 'incoming'
}

interface LocalGraphProps {
  noteId: string
  noteTitle: string
  links: LocalGraphLink[]
}

type LocalGraphNode = d3.SimulationNodeDatum & {
  id: string
  title: string
  isCenter: boolean
  direction?: 'outgoing' | 'incoming'
}

type LocalGraphEdge = d3.SimulationLinkDatum<LocalGraphNode> & {
  source: string | LocalGraphNode
  target: string | LocalGraphNode
}

const CENTER_COLOR = '#3b82f6'
const OUTGOING_COLOR = '#10b981'
const INCOMING_COLOR = '#f59e0b'

export function LocalGraph({ noteId, noteTitle, links }: LocalGraphProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 340, height: 220 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const width = Math.max(300, Math.floor(entry.contentRect.width))
      const height = 220
      setDimensions({ width, height })
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const graphData = useMemo(() => {
    const centerNode: LocalGraphNode = {
      id: noteId,
      title: noteTitle || '제목 없음',
      isCenter: true,
    }

    const sideNodes: LocalGraphNode[] = links.map((link) => ({
      id: link.id,
      title: link.title || '제목 없음',
      isCenter: false,
      direction: link.direction,
    }))

    const nodes: LocalGraphNode[] = [centerNode, ...sideNodes]
    const edges: LocalGraphEdge[] = links.map((link) => ({
      source: link.direction === 'outgoing' ? noteId : link.id,
      target: link.direction === 'outgoing' ? link.id : noteId,
    }))

    return { nodes, edges }
  }, [links, noteId, noteTitle])

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', dimensions.width).attr('height', dimensions.height)

    if (graphData.nodes.length <= 1) return

    const linkForce = d3
      .forceLink<LocalGraphNode, LocalGraphEdge>(graphData.edges)
      .id((d) => d.id)
      .distance(70)

    const simulation = d3
      .forceSimulation<LocalGraphNode>(graphData.nodes)
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<LocalGraphNode>().radius((d) => (d.isCenter ? 18 : 14)))

    const link = svg
      .append('g')
      .selectAll('line')
      .data(graphData.edges)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', 1.5)

    const node = svg
      .append('g')
      .selectAll<SVGCircleElement, LocalGraphNode>('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => (d.isCenter ? 11 : 8))
      .attr('fill', (d) => {
        if (d.isCenter) return CENTER_COLOR
        return d.direction === 'outgoing' ? OUTGOING_COLOR : INCOMING_COLOR
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', (d) => (d.isCenter ? 'default' : 'pointer'))
      .on('click', (_, d) => {
        if (d.isCenter) return
        router.push(`/notes?noteId=${d.id}`)
      })

    const label = svg
      .append('g')
      .selectAll<SVGTextElement, LocalGraphNode>('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .text((d) => (d.title.length > 16 ? `${d.title.slice(0, 16)}...` : d.title))
      .attr('font-size', 10)
      .attr('fill', '#334155')
      .attr('dx', 10)
      .attr('dy', 4)
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => ((d.source as LocalGraphNode).x ?? 0))
        .attr('y1', (d) => ((d.source as LocalGraphNode).y ?? 0))
        .attr('x2', (d) => ((d.target as LocalGraphNode).x ?? 0))
        .attr('y2', (d) => ((d.target as LocalGraphNode).y ?? 0))

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    })

    return () => {
      simulation.stop()
    }
  }, [dimensions, graphData, router])

  return (
    <div ref={containerRef} className="panel-soft rounded-xl border border-indigo-200/70 p-3 dark:border-indigo-700/60">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Local Graph</h3>
        <div className="flex items-center gap-3 text-[11px] text-indigo-600 dark:text-indigo-300">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            현재
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Out
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            In
          </span>
        </div>
      </div>
      {links.length === 0 ? (
        <div className="py-8 text-center text-xs text-indigo-500 dark:text-indigo-300">
          연결된 노트가 없습니다.
        </div>
      ) : (
        <svg ref={svgRef} className="w-full" />
      )}
    </div>
  )
}
