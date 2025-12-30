import { useQuery } from '@tanstack/react-query'

interface GraphNode {
  id: string
  title: string
  folderId: string | null
  folderName: string | null
}

interface GraphEdge {
  id: string
  source: string
  target: string
}

interface Folder {
  id: string
  name: string
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  folders: Folder[]
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
