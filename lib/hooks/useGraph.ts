import { useQuery } from '@tanstack/react-query'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3'

// 기본 Graph 타입
export interface GraphNode {
  id: string
  title: string
  folderId: string | null
  folderName: string | null
}

export interface GraphEdge {
  id: string
  source: string
  target: string
}

export interface GraphFolder {
  id: string
  name: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  folders: GraphFolder[]
}

// D3 시뮬레이션용 확장 타입
export interface SimulationNode extends SimulationNodeDatum, GraphNode {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface SimulationLink extends SimulationLinkDatum<SimulationNode> {
  source: SimulationNode | string
  target: SimulationNode | string
}

// Graph 데이터 조회
export function useGraph() {
  return useQuery<GraphData, Error>({
    queryKey: ['graph'],
    queryFn: async () => {
      const response = await fetch('/api/graph')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.graph
    },
  })
}
