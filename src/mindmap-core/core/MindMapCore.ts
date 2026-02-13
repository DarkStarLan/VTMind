/**
 * VMind 思维导图核心类
 * 整合所有功能模块，提供统一的 API
 */

import type {
  NodeData,
  MindMapConfig,
  LayoutConfig,
  ThemeConfig,
  AnimationConfig,
  InteractionConfig,
  EventType,
  EventHandler,
  ExportConfig,
  HistoryRecord,
} from '../types'
import { LayoutEngine } from '../layout/LayoutEngine'
import { RenderEngine } from '../render/RenderEngine'
import { EventManager } from '../events/EventManager'
import { AnimationEngine } from '../animation/AnimationEngine'
import { ThemeManager } from '../theme/ThemeManager'
import { generateId, deepClone, findNode, traverseTree, downloadFile } from '../utils'
import { DEFAULT_CONFIG } from '../constants'

export class MindMapCore {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private config: MindMapConfig
  
  // 核心引擎
  private layoutEngine: LayoutEngine
  private renderEngine: RenderEngine
  private eventManager: EventManager
  private animationEngine: AnimationEngine
  private themeManager: ThemeManager
  
  // 数据
  private rootNode: NodeData | null = null
  
  // 历史记录
  private history: HistoryRecord[] = []
  private historyIndex = -1
  private maxHistorySize = 50
  
  // 渲染循环
  private rafId: number | null = null
  private needsRender = true
  
  constructor(config: MindMapConfig) {
    this.config = config
    
    // 获取容器
    this.container = typeof config.container === 'string'
      ? document.querySelector(config.container)!
      : config.container
    
    if (!this.container) {
      throw new Error('Container not found')
    }
    
    // 创建画布
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.container.appendChild(this.canvas)
    
    // 初始化引擎
    this.layoutEngine = new LayoutEngine(
      config.layout || { type: 'mindmap' }
    )
    
    this.renderEngine = new RenderEngine(this.canvas, config.render)
    
    this.eventManager = new EventManager(this.canvas)
    
    this.animationEngine = new AnimationEngine(config.animation)
    
    this.themeManager = new ThemeManager()
    if (config.theme) {
      this.themeManager.setTheme(config.theme)
    }
    
    // 设置数据
    if (config.data) {
      this.setData(config.data)
    }
    
    // 绑定事件
    this.bindEvents()
    
    // 启动渲染循环
    this.startRenderLoop()
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this))
  }
  
  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 节点事件
    this.eventManager.on('node:click', (e) => {
      this.requestRender()
    })
    
    this.eventManager.on('node:drag', (e) => {
      this.requestRender()
    })
    
    this.eventManager.on('node:mouseenter', (e) => {
      this.requestRender()
    })
    
    this.eventManager.on('node:mouseleave', (e) => {
      this.requestRender()
    })
    
    // 折叠/展开事件
    this.eventManager.on('node:collapse', (e) => {
      if (e.target) {
        this.toggleCollapse(e.target.id)
      }
    })
    
    this.eventManager.on('node:expand', (e) => {
      if (e.target) {
        this.toggleCollapse(e.target.id)
      }
    })
    
    // 画布事件
    this.eventManager.on('canvas:pan', (e) => {
      const transform = this.eventManager.getTransform()
      this.renderEngine.setTransform(transform.x, transform.y, transform.scale)
      this.requestRender()
    })
    
    this.eventManager.on('canvas:zoom', (e) => {
      const transform = this.eventManager.getTransform()
      this.renderEngine.setTransform(transform.x, transform.y, transform.scale)
      this.requestRender()
    })
    
    this.eventManager.on('selection:change', (e) => {
      this.requestRender()
    })
  }
  
  /**
   * 启动渲染循环
   */
  private startRenderLoop(): void {
    const render = () => {
      if (this.needsRender && this.rootNode) {
        this.renderEngine.render(this.rootNode, this.themeManager.getCurrentTheme())
        this.needsRender = false
      }
      
      this.rafId = requestAnimationFrame(render)
    }
    
    render()
  }
  
  /**
   * 请求重新渲染
   */
  private requestRender(): void {
    this.needsRender = true
  }
  
  /**
   * 公开请求渲染方法（供外部调用）
   */
  public forceRender(): void {
    this.requestRender()
  }
  
  /**
   * 获取渲染引擎（供外部访问）
   */
  public getRenderEngine(): RenderEngine {
    return this.renderEngine
  }
  
  /**
   * 处理窗口大小变化
   */
  private handleResize(): void {
    this.renderEngine.resize()
    this.requestRender()
  }
  
  /**
   * 设置数据
   */
  setData(data: NodeData, autoFit: boolean = true): void {
    this.rootNode = deepClone(data)
    this.eventManager.setRootNode(this.rootNode)
    this.layout()
    this.requestRender()
    
    // 初始居中（只在明确要求且配置允许时执行）
    if (autoFit && this.config.initialCenter !== false) {
      this.fitView()
    }
  }
  
  /**
   * 获取数据
   */
  getData(): NodeData | null {
    return this.rootNode ? deepClone(this.rootNode) : null
  }
  
  /**
   * 执行布局
   */
  layout(): void {
    if (this.rootNode) {
      this.layoutEngine.layout(this.rootNode, this.themeManager.getCurrentTheme())
      this.requestRender()
    }
  }
  
  /**
   * 添加节点
   */
  addNode(parentId: string, node: Partial<NodeData>): NodeData | null {
    if (!this.rootNode) return null
    
    const parent = findNode(this.rootNode, (n) => n.id === parentId)
    if (!parent) return null
    
    const newNode: NodeData = {
      id: node.id || generateId(),
      label: node.label || '新节点',
      children: [],
      ...node,
    }
    
    if (!parent.children) {
      parent.children = []
    }
    
    parent.children.push(newNode)
    
    // 记录历史
    this.recordHistory({
      type: 'add',
      nodeId: newNode.id,
      after: newNode,
      timestamp: Date.now(),
    })
    
    // 重新布局
    this.layout()
    
    // 动画
    if (this.config.animation?.enabled !== false) {
      this.animationEngine.animateNodeEnter(newNode)
    }
    
    this.requestRender()
    
    return newNode
  }
  
  /**
   * 删除节点
   */
  removeNode(nodeId: string): boolean {
    if (!this.rootNode || nodeId === this.rootNode.id) return false
    
    let removed = false
    
    traverseTree(this.rootNode, (node) => {
      if (node.children) {
        const index = node.children.findIndex((child) => child.id === nodeId)
        if (index !== -1) {
          const removedNode = node.children[index]
          
          // 记录历史
          this.recordHistory({
            type: 'remove',
            nodeId,
            before: removedNode,
            timestamp: Date.now(),
          })
          
          node.children.splice(index, 1)
          removed = true
          return false
        }
      }
    })
    
    if (removed) {
      this.layout()
      this.requestRender()
    }
    
    return removed
  }
  
  /**
   * 更新节点
   */
  updateNode(nodeId: string, updates: Partial<NodeData>): boolean {
    if (!this.rootNode) return false
    
    const node = findNode(this.rootNode, (n) => n.id === nodeId)
    if (!node) return false
    
    // 记录历史
    this.recordHistory({
      type: 'update',
      nodeId,
      before: deepClone(node),
      after: { ...node, ...updates },
      timestamp: Date.now(),
    })
    
    Object.assign(node, updates)
    
    this.layout()
    this.requestRender()
    
    return true
  }
  
  /**
   * 折叠/展开节点
   */
  toggleCollapse(nodeId: string): boolean {
    if (!this.rootNode) return false
    
    const node = findNode(this.rootNode, (n) => n.id === nodeId)
    if (!node || !node.children || node.children.length === 0) return false
    
    node.collapsed = !node.collapsed
    
    this.layout()
    this.requestRender()
    
    return true
  }
  
  /**
   * 查找节点
   */
  findNode(predicate: (node: NodeData) => boolean): NodeData | null {
    return this.rootNode ? findNode(this.rootNode, predicate) : null
  }
  
  /**
   * 设置布局
   */
  setLayout(config: LayoutConfig): void {
    this.layoutEngine.updateConfig(config)
    this.layout()
  }
  
  /**
   * 设置主题
   */
  setTheme(themeOrId: string | ThemeConfig): void {
    this.themeManager.setTheme(themeOrId)
    this.renderEngine.clearCache()
    this.requestRender()
  }
  
  /**
   * 获取主题
   */
  getTheme(): ThemeConfig {
    return this.themeManager.getCurrentTheme()
  }
  
  /**
   * 注册主题
   */
  registerTheme(id: string, theme: ThemeConfig): void {
    this.themeManager.registerTheme(id, theme)
  }
  
  /**
   * 适应视图
   */
  fitView(padding: number = 50): void {
    if (!this.rootNode) return
    
    // 计算所有节点的边界
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    traverseTree(this.rootNode, (node) => {
      if (node.x !== undefined && node.y !== undefined && node.width && node.height) {
        minX = Math.min(minX, node.x - node.width / 2)
        minY = Math.min(minY, node.y - node.height / 2)
        maxX = Math.max(maxX, node.x + node.width / 2)
        maxY = Math.max(maxY, node.y + node.height / 2)
      }
    })
    
    // 如果没有有效的节点，直接返回
    if (minX === Infinity || minY === Infinity) return
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    // 使用画布的实际像素尺寸除以 pixelRatio 得到逻辑尺寸
    const pixelRatio = this.config.render?.pixelRatio || window.devicePixelRatio || 1
    const canvasWidth = this.canvas.width / pixelRatio
    const canvasHeight = this.canvas.height / pixelRatio
    
    // 计算缩放比例，确保内容完全可见
    const scaleX = (canvasWidth - padding * 2) / contentWidth
    const scaleY = (canvasHeight - padding * 2) / contentHeight
    const scale = Math.min(scaleX, scaleY, 1)
    
    // 视野中心对准根节点（根节点坐标通常是 0, 0）
    const rootX = this.rootNode.x || 0
    const rootY = this.rootNode.y || 0
    
    // 偏移量 = -根节点坐标，这样根节点就会对齐到画布中心
    const offsetX = -rootX
    const offsetY = -rootY
    
    this.eventManager.setTransform(offsetX, offsetY, scale)
    this.renderEngine.setTransform(offsetX, offsetY, scale)
    this.requestRender()
  }
  
  /**
   * 缩放
   */
  zoom(scale: number): void {
    const transform = this.eventManager.getTransform()
    const newScale = Math.max(0.1, Math.min(5, transform.scale * scale))
    
    this.eventManager.setTransform(transform.x, transform.y, newScale)
    this.renderEngine.setTransform(transform.x, transform.y, newScale)
    this.requestRender()
  }
  
  /**
   * 重置视图
   */
  resetView(): void {
    this.eventManager.setTransform(0, 0, 1)
    this.renderEngine.setTransform(0, 0, 1)
    this.requestRender()
  }
  
  /**
   * 导出
   */
  async export(config: ExportConfig): Promise<void> {
    const format = config.format
    
    switch (format) {
      case 'png':
      case 'jpg':
        this.exportImage(config)
        break
      case 'json':
        this.exportJSON()
        break
      case 'svg':
        this.exportSVG()
        break
      case 'markdown':
        this.exportMarkdown()
        break
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }
  
  /**
   * 导出图片
   */
  private exportImage(config: ExportConfig): void {
    if (!this.rootNode) return
    
    // 获取当前主题
    const currentTheme = this.themeManager.getCurrentTheme()
    
    // 调试：打印主题信息
    console.log('Export - Current Theme:', currentTheme)
    console.log('Export - Background Color:', currentTheme.global?.backgroundColor)
    
    // 计算所有节点的边界
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    traverseTree(this.rootNode, (node) => {
      if (node.x !== undefined && node.y !== undefined && node.width && node.height) {
        minX = Math.min(minX, node.x - node.width / 2)
        minY = Math.min(minY, node.y - node.height / 2)
        maxX = Math.max(maxX, node.x + node.width / 2)
        maxY = Math.max(maxY, node.y + node.height / 2)
      }
    })
    
    if (minX === Infinity || minY === Infinity) return
    
    const padding = 50
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2
    
    // 创建临时高分辨率画布
    const exportCanvas = document.createElement('canvas')
    const exportPixelRatio = 2 // 使用2倍分辨率以获得更清晰的图片
    
    // 直接设置画布尺寸（不依赖 DOM）
    exportCanvas.width = contentWidth * exportPixelRatio
    exportCanvas.height = contentHeight * exportPixelRatio
    
    const exportCtx = exportCanvas.getContext('2d')!
    
    // 应用高分辨率缩放
    exportCtx.scale(exportPixelRatio, exportPixelRatio)
    
    // 设置抗锯齿
    exportCtx.imageSmoothingEnabled = true
    exportCtx.imageSmoothingQuality = 'high'
    
    // 根据主题填充背景色
    const backgroundColor = currentTheme.global?.backgroundColor || '#ffffff'
    console.log('Export - Using Background Color:', backgroundColor)
    exportCtx.fillStyle = backgroundColor
    exportCtx.fillRect(0, 0, contentWidth, contentHeight)
    
    // 应用变换：先平移到画布中心
    exportCtx.translate(contentWidth / 2, contentHeight / 2)
    
    // 计算内容中心点
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    // 平移使内容居中
    exportCtx.translate(-centerX, -centerY)
    
    // 手动渲染（不使用 RenderEngine 以避免初始化问题）
    this.renderToContext(exportCtx, this.rootNode, currentTheme)
    
    // 导出图片
    const dataURL = exportCanvas.toDataURL(
      `image/${config.format}`,
      config.quality || 1
    )
    
    const link = document.createElement('a')
    link.download = `mindmap.${config.format}`
    link.href = dataURL
    link.click()
  }
  
  /**
   * 渲染到指定的 Context（用于导出）
   */
  private renderToContext(ctx: CanvasRenderingContext2D, root: NodeData, theme: any): void {
    // 先绘制连线
    this.renderEdgesToContext(ctx, root, theme)
    
    // 再绘制节点
    this.renderNodesToContext(ctx, root, theme, 0)
  }
  
  /**
   * 渲染连线到指定的 Context
   */
  private renderEdgesToContext(ctx: CanvasRenderingContext2D, node: NodeData, theme: any): void {
    if (!node.children || node.collapsed) return
    
    const edgeStyle = theme?.edgeStyle || DEFAULT_CONFIG.EDGE
    
    for (const child of node.children) {
      if (child.x !== undefined && child.y !== undefined) {
        this.drawEdgeToContext(ctx, node, child, edgeStyle)
        this.renderEdgesToContext(ctx, child, theme)
      }
    }
  }
  
  /**
   * 绘制连线到指定的 Context
   */
  private drawEdgeToContext(ctx: CanvasRenderingContext2D, from: NodeData, to: NodeData, style: any): void {
    ctx.save()
    
    ctx.strokeStyle = style.color || '#999'
    ctx.lineWidth = style.width || 2
    
    if (style.style === 'dashed') {
      ctx.setLineDash([5, 5])
    } else if (style.style === 'dotted') {
      ctx.setLineDash([2, 2])
    }
    
    ctx.beginPath()
    
    const curve = style.curve || 'bezier'
    const dx = to.x! - from.x!
    const dy = to.y! - from.y!
    
    if (curve === 'bezier') {
      const cp1x = from.x! + dx * 0.5
      const cp1y = from.y!
      const cp2x = to.x! - dx * 0.5
      const cp2y = to.y!
      
      ctx.moveTo(from.x!, from.y!)
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x!, to.y!)
    } else {
      ctx.moveTo(from.x!, from.y!)
      ctx.lineTo(to.x!, to.y!)
    }
    
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.restore()
  }
  
  /**
   * 渲染节点到指定的 Context
   */
  private renderNodesToContext(ctx: CanvasRenderingContext2D, node: NodeData, theme: any, level: number): void {
    if (node.x === undefined || node.y === undefined) return
    
    ctx.save()
    ctx.translate(node.x, node.y)
    
    // 获取节点样式
    const style = this.getNodeStyleForExport(node, level, theme)
    
    // 绘制节点形状
    const x = -node.width! / 2
    const y = -node.height! / 2
    const width = node.width!
    const height = node.height!
    const radius = style.borderRadius || 4
    
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    
    ctx.fillStyle = style.backgroundColor || '#fff'
    ctx.fill()
    
    ctx.strokeStyle = style.borderColor || '#ddd'
    ctx.lineWidth = style.borderWidth || 2
    ctx.stroke()
    
    // 绘制文本
    ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 14}px ${style.fontFamily || 'Arial'}`
    ctx.fillStyle = style.color || '#333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.label, 0, 0)
    
    ctx.restore()
    
    // 渲染子节点
    if (node.children && !node.collapsed) {
      node.children.forEach(child => this.renderNodesToContext(ctx, child, theme, level + 1))
    }
  }
  
  /**
   * 获取节点样式（用于导出）
   */
  private getNodeStyleForExport(node: NodeData, level: number, theme?: any): any {
    const defaultStyle = {
      width: DEFAULT_CONFIG.NODE.width,
      height: DEFAULT_CONFIG.NODE.height,
      padding: DEFAULT_CONFIG.NODE.padding,
      borderRadius: DEFAULT_CONFIG.NODE.borderRadius,
      borderWidth: DEFAULT_CONFIG.NODE.borderWidth,
      fontSize: DEFAULT_CONFIG.NODE.fontSize,
      fontFamily: DEFAULT_CONFIG.NODE.fontFamily,
      fontWeight: DEFAULT_CONFIG.NODE.fontWeight,
      color: DEFAULT_CONFIG.NODE.color,
      backgroundColor: DEFAULT_CONFIG.NODE.backgroundColor,
      borderColor: DEFAULT_CONFIG.NODE.borderColor,
    }
    
    if (node.style) {
      return Object.assign({}, defaultStyle, node.style)
    }
    
    if (theme?.nodeStyles) {
      if (level === 0 && theme.nodeStyles.root) {
        return Object.assign({}, defaultStyle, theme.nodeStyles.root)
      }
      if (level === 1 && theme.nodeStyles.level1) {
        return Object.assign({}, defaultStyle, theme.nodeStyles.level1)
      }
      if (level === 2 && theme.nodeStyles.level2) {
        return Object.assign({}, defaultStyle, theme.nodeStyles.level2)
      }
      if (theme.nodeStyles.default) {
        return Object.assign({}, defaultStyle, theme.nodeStyles.default)
      }
    }
    
    return defaultStyle
  }
  
  /**
   * 导出 JSON
   */
  private exportJSON(): void {
    if (!this.rootNode) return
    
    const json = JSON.stringify(this.rootNode, null, 2)
    downloadFile(json, 'mindmap.json')
  }
  
  /**
   * 导出 SVG
   */
  private exportSVG(): void {
    // TODO: 实现 SVG 导出
    console.warn('SVG export not implemented yet')
  }
  
  /**
   * 导出 Markdown
   */
  private exportMarkdown(): void {
    if (!this.rootNode) return
    
    let markdown = ''
    
    traverseTree(this.rootNode, (node, level) => {
      const indent = '  '.repeat(level)
      markdown += `${indent}- ${node.label}\n`
    })
    
    downloadFile(markdown, 'mindmap.md')
  }
  
  /**
   * 监听事件
   */
  on(type: EventType, handler: EventHandler): void {
    this.eventManager.on(type, handler)
  }
  
  /**
   * 取消监听
   */
  off(type: EventType, handler: EventHandler): void {
    this.eventManager.off(type, handler)
  }
  
  /**
   * 记录历史
   */
  private recordHistory(record: HistoryRecord): void {
    // 删除当前位置之后的历史
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // 添加新记录
    this.history.push(record)
    
    // 限制历史记录数量
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }
  
  /**
   * 撤销
   */
  undo(): boolean {
    if (this.historyIndex < 0) return false
    
    const record = this.history[this.historyIndex]
    // TODO: 实现撤销逻辑
    
    this.historyIndex--
    this.layout()
    this.requestRender()
    
    return true
  }
  
  /**
   * 重做
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false
    
    this.historyIndex++
    const record = this.history[this.historyIndex]
    // TODO: 实现重做逻辑
    
    this.layout()
    this.requestRender()
    
    return true
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    // 停止渲染循环
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
    
    // 销毁引擎
    this.animationEngine.destroy()
    this.eventManager.destroy()
    
    // 移除画布
    this.container.removeChild(this.canvas)
    
    // 移除事件监听
    window.removeEventListener('resize', this.handleResize.bind(this))
  }
}

