import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3'

export interface FolderSummary {
  id: string
  name: string
}

export interface TagSummary {
  id: string
  name: string
  color: string | null
}

export interface NoteProperty {
  id: string
  propertyId: string
  value: unknown
  property: {
    id: string
    name: string
    type: string
    options: string[] | null
  }
}

export interface Note {
  id: string
  title: string
  body: string
  folderId: string | null
  isPinned: boolean
  pinnedAt: Date | null
  createdAt: Date
  updatedAt: Date
  folder?: FolderSummary | null
  tags?: Array<{
    tag: TagSummary
  }>
  properties?: NoteProperty[]
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  position: number
  isDefault: boolean
  children?: Folder[]
  _count?: {
    notes: number
  }
}

export interface Tag {
  id: string
  name: string
  color: string | null
  _count?: {
    notes: number
  }
}

export interface GraphNode {
  id: string
  title: string
  folderId: string | null
  folderName: string | null
  isMissing?: boolean
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
  latestUpdatedNoteId?: string | null
  unresolved: Array<{
    title: string
    sources: Array<{ id: string; title: string }>
  }>
}

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
