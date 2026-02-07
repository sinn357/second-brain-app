import { useQuery } from '@tanstack/react-query'
import { parseApiJson } from '@/lib/contracts/api'
import type { GraphData, SimulationLink, SimulationNode } from '@/lib/contracts/entities'
import { graphResponseSchema } from '@/lib/contracts/schemas'

export type { GraphData, SimulationLink, SimulationNode }

// Graph 데이터 조회
export function useGraph() {
  return useQuery<GraphData, Error>({
    queryKey: ['graph'],
    queryFn: async () => {
      const response = await fetch('/api/graph')
      const data = await parseApiJson(response, graphResponseSchema)
      return data.graph
    },
  })
}
