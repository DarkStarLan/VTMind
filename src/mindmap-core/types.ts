/**
 * 思维导图核心类型定义
 */

// 节点数据结构
export interface NodeData {
  id: string
  label: string
  children?: NodeData[]
  parent?: string
  
  // 样式属性
  style?: NodeStyle
  
  // 位置信息（由布局引擎计算）
  x?: number
  y?: number
  width?: number
  height?: number
  
  // 扩展属性
  collapsed?: boolean
  selected?: boolean
  hovered?: boolean
  editing?: boolean
  
  // 自定义数据
  data?: Record<string, any>
}

// 节点样式
export interface NodeStyle {
  // 背景
  backgroundColor?: string
  backgroundImage?: string
  
  // 边框
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  
  // 文字
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  
  // 内边距
  padding?: number | [number, number] | [number, number, number, number]
  
  // 阴影
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  
  // 形状
  shape?: 'rect' | 'rounded' | 'circle' | 'ellipse' | 'diamond' | 'hexagon' | 'cloud' | 'custom'
  
  // 图标
  icon?: string
  iconSize?: number
  iconColor?: string
}

// 连线样式
export interface EdgeStyle {
  color?: string
  width?: number
  style?: 'solid' | 'dashed' | 'dotted'
  curve?: 'straight' | 'bezier' | 'polyline' | 'arc'
  arrow?: boolean
  arrowSize?: number
  animated?: boolean
}

// 布局类型
export type LayoutType = 
  | 'tree-right'      // 树形布局（向右）
  | 'tree-left'       // 树形布局（向左）
  | 'tree-down'       // 树形布局（向下）
  | 'tree-up'         // 树形布局（向上）
  | 'mindmap'         // 思维导图布局（左右分布）
  | 'radial'          // 放射状布局
  | 'fishbone'        // 鱼骨图布局
  | 'timeline'        // 时间轴布局
  | 'org-chart'       // 组织架构图
  | 'network'         // 网络图布局
  | 'custom'          // 自定义布局

// 布局配置
export interface LayoutConfig {
  type: LayoutType
  
  // 间距配置
  nodeSpacing?: number        // 节点间距
  levelSpacing?: number       // 层级间距
  branchSpacing?: number      // 分支间距
  
  // 对齐方式
  align?: 'top' | 'center' | 'bottom'
  
  // 方向
  direction?: 'horizontal' | 'vertical'
  
  // 是否保留已有位置（用于恢复保存的布局）
  preservePosition?: boolean
  
  // 自定义布局函数
  customLayout?: (nodes: NodeData[], root: NodeData) => void
}

// 主题配置
export interface ThemeConfig {
  name: string
  
  // 全局样式
  global?: {
    backgroundColor?: string
    fontFamily?: string
  }
  
  // 节点样式（按层级）
  nodeStyles?: {
    root?: NodeStyle
    level1?: NodeStyle
    level2?: NodeStyle
    level3?: NodeStyle
    default?: NodeStyle
  }
  
  // 连线样式
  edgeStyle?: EdgeStyle
  
  // 颜色方案
  colorScheme?: string[]
}

// 动画配置
export interface AnimationConfig {
  enabled?: boolean
  duration?: number
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'
  
  // 动画类型
  nodeEnter?: 'fade' | 'scale' | 'slide' | 'bounce'
  nodeExit?: 'fade' | 'scale' | 'slide'
  nodeUpdate?: 'morph' | 'fade'
  
  // 延迟（用于级联动画）
  delay?: number
  stagger?: number
}

// 交互配置
export interface InteractionConfig {
  // 拖拽
  draggable?: boolean
  dragNode?: boolean
  dragCanvas?: boolean
  
  // 缩放
  zoomable?: boolean
  minZoom?: number
  maxZoom?: number
  zoomSpeed?: number
  
  // 选择
  selectable?: boolean
  multiSelect?: boolean
  
  // 编辑
  editable?: boolean
  
  // 折叠
  collapsible?: boolean
  
  // 快捷键
  shortcuts?: Record<string, () => void>
}

// 渲染配置
export interface RenderConfig {
  // 渲染器类型
  renderer?: 'canvas' | 'svg' | 'webgl'
  
  // 性能优化
  enableVirtualization?: boolean  // 虚拟化渲染
  enableCache?: boolean           // 缓存
  enableDirtyCheck?: boolean      // 脏检查
  
  // 抗锯齿
  antialias?: boolean
  
  // DPI
  pixelRatio?: number
}

// 导出配置
export interface ExportConfig {
  format: 'png' | 'jpg' | 'svg' | 'json' | 'markdown' | 'pdf'
  quality?: number
  backgroundColor?: string
  padding?: number
  scale?: number
}

// 事件类型
export type EventType = 
  | 'node:click'
  | 'node:dblclick'
  | 'node:contextmenu'
  | 'node:mouseenter'
  | 'node:mouseleave'
  | 'node:dragstart'
  | 'node:drag'
  | 'node:dragend'
  | 'node:add'
  | 'node:remove'
  | 'node:update'
  | 'node:collapse'
  | 'node:expand'
  | 'edge:click'
  | 'canvas:click'
  | 'canvas:contextmenu'
  | 'canvas:zoom'
  | 'canvas:pan'
  | 'selection:change'
  | 'data:change'
  | 'render:complete'

// 事件处理器
export type EventHandler = (event: MindMapEvent) => void

// 事件对象
export interface MindMapEvent {
  type: EventType
  target?: NodeData
  originalEvent?: MouseEvent | KeyboardEvent | WheelEvent
  data?: any
}

// 思维导图配置
export interface MindMapConfig {
  // 容器
  container: HTMLElement | string
  
  // 数据
  data?: NodeData
  
  // 布局
  layout?: LayoutConfig
  
  // 主题
  theme?: ThemeConfig | string
  
  // 动画
  animation?: AnimationConfig
  
  // 交互
  interaction?: InteractionConfig
  
  // 渲染
  render?: RenderConfig
  
  // 初始视图
  initialZoom?: number
  initialCenter?: boolean
  
  // 插件
  plugins?: any[]
}

// 插件接口
export interface Plugin {
  name: string
  install: (mindmap: any) => void
  uninstall?: (mindmap: any) => void
}

// 历史记录
export interface HistoryRecord {
  type: 'add' | 'remove' | 'update' | 'move'
  nodeId: string
  before?: any
  after?: any
  timestamp: number
}

