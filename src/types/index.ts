export interface MindNode {
  id: string
  label: string
  children?: MindNode[]
  style?: {
    fill?: string
    stroke?: string
  }
  nodeType?: 'default' | 'underline' | 'outline' | 'circle' | 'diamond' | 'tag'
  group?: string
  groupLabel?: string
  // 节点位置信息
  x?: number
  y?: number
  // 节点尺寸信息
  width?: number
  height?: number
  // 折叠状态
  collapsed?: boolean
}

export interface MindMapData {
  id: string
  name: string
  root: MindNode
  structure?: 'tree' | 'radial' | 'fishbone' | 'network' | 'timeline'
  layoutOption?: string
  createdAt: number
  updatedAt: number
  // 新增：保存完整的图数据（支持树形结构和图结构）
  graphData?: any
}

export interface AIProvider {
  id: string
  name: string
  baseURL: string
  models: string[]
}

export interface APIConfig {
  provider: string
  apiKey: string
  model: string
  baseURL?: string
}

export interface StorageData {
  apiConfigs: APIConfig[]
  mindMaps: MindMapData[]
  currentMapId?: string
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIGenerateOptions {
  topic: string
  structure?: 'tree' | 'radial' | 'fishbone' | 'network' | 'timeline'
  customPrompt?: string
  depth?: number
  branches?: number
  language?: string
}

export interface MindMapStructure {
  id: string
  name: string
  description: string
  icon: string
  layouts: LayoutOption[]
}

export interface LayoutOption {
  id: string
  name: string
  description: string
  recommended: boolean
}

export interface StructureRecommendation {
  recommended: string
  reason: string
  alternatives: Array<{ structure: string; reason: string }>
}

