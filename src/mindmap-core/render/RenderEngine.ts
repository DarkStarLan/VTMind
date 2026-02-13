/**
 * 渲染引擎 - 负责绘制思维导图
 */

import type { NodeData, EdgeStyle, RenderConfig } from '../types'
import { DEFAULT_CONFIG } from '../constants'
import { normalizePadding, hexToRgba } from '../utils'

export class RenderEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: Required<RenderConfig>
  private transform = { x: 0, y: 0, scale: 1 }
  private nodeCache = new Map<string, HTMLCanvasElement>()
  private backgroundColor = 'transparent'
  
  constructor(canvas: HTMLCanvasElement, config: RenderConfig = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    
    this.config = {
      renderer: config.renderer || 'canvas',
      enableVirtualization: config.enableVirtualization ?? false,
      enableCache: config.enableCache ?? DEFAULT_CONFIG.RENDER.ENABLE_CACHE,
      enableDirtyCheck: config.enableDirtyCheck ?? true,
      antialias: config.antialias ?? DEFAULT_CONFIG.RENDER.ANTIALIAS,
      pixelRatio: config.pixelRatio || DEFAULT_CONFIG.RENDER.PIXEL_RATIO,
    }
    
    this.setupCanvas()
  }
  
  /**
   * 设置画布
   */
  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * this.config.pixelRatio
    this.canvas.height = rect.height * this.config.pixelRatio
    this.ctx.scale(this.config.pixelRatio, this.config.pixelRatio)
    
    if (this.config.antialias) {
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    }
  }
  
  /**
   * 渲染思维导图
   */
  render(root: NodeData, theme?: any): void {
    this.clear()
    
    // 应用变换
    this.ctx.save()
    
    // 先平移到画布中心
    this.ctx.translate(
      this.canvas.width / (2 * this.config.pixelRatio),
      this.canvas.height / (2 * this.config.pixelRatio)
    )
    
    // 应用缩放
    this.ctx.scale(this.transform.scale, this.transform.scale)
    
    // 应用偏移（注意：偏移需要除以缩放比例，因为已经应用了缩放）
    this.ctx.translate(
      this.transform.x / this.transform.scale,
      this.transform.y / this.transform.scale
    )
    
    // 先绘制连线
    this.renderEdges(root, theme)
    
    // 再绘制节点
    this.renderNodes(root, theme)
    
    this.ctx.restore()
  }
  
  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制背景（如果设置了背景色）
    if (this.backgroundColor && this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }
  
  /**
   * 设置背景颜色
   */
  setBackgroundColor(color: string): void {
    this.backgroundColor = color
  }
  
  /**
   * 渲染节点
   */
  private renderNodes(node: NodeData, theme?: any, level: number = 0): void {
    if (node.x === undefined || node.y === undefined) return
    
    // 获取样式
    const style = this.getNodeStyle(node, level, theme)
    
    // 直接绘制节点，不使用缓存以保持清晰度
    this.ctx.save()
    
    // 绘制节点
    this.drawNode(node, style)
    
    this.ctx.restore()
    
    // 渲染子节点
    if (node.children && !node.collapsed) {
      node.children.forEach(child => this.renderNodes(child, theme, level + 1))
    }
  }
  
  /**
   * 绘制节点
   */
  private drawNode(node: NodeData, style: any): void {
    // 检查节点尺寸
    if (!node.width || !node.height) {
      return
    }
    
    this.ctx.save()
    this.ctx.translate(node.x!, node.y!)
    
    // 获取当前缩放比例
    const currentTransform = this.ctx.getTransform()
    const scale = Math.sqrt(currentTransform.a * currentTransform.a + currentTransform.b * currentTransform.b)
    
    // 绘制选中状态
    if (node.selected) {
      this.ctx.strokeStyle = '#4a90e2'
      this.ctx.lineWidth = 3 / scale
      this.ctx.setLineDash([5 / scale, 5 / scale])
      const padding = 4
      this.ctx.beginPath()
      this.drawShape(
        this.ctx,
        style.shape || 'rounded',
        -node.width! / 2 - padding,
        -node.height! / 2 - padding,
        node.width! + padding * 2,
        node.height! + padding * 2,
        (style.borderRadius || 4) + padding
      )
      this.ctx.stroke()
      this.ctx.setLineDash([])
    }
    
    // 绘制悬停状态
    if (node.hovered) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      this.ctx.shadowBlur = 10 / scale
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 2 / scale
    }
    
    // 绘制节点形状
    this.drawNodeShape(this.ctx, node, style)
    
    // 绘制节点文本
    this.drawNodeText(this.ctx, node, style)
    
    // 绘制折叠指示器
    if (node.children && node.children.length > 0) {
      this.drawCollapseIndicator(node, style)
    }
    
    this.ctx.restore()
  }
  
  /**
   * 绘制节点形状
   */
  private drawNodeShape(ctx: CanvasRenderingContext2D, node: NodeData, style: any): void {
    const x = -node.width! / 2
    const y = -node.height! / 2
    const width = node.width!
    const height = node.height!
    const radius = style.borderRadius || 4
    
    // 获取当前缩放比例，调整线宽以保持视觉一致性
    const currentTransform = ctx.getTransform()
    const scale = Math.sqrt(currentTransform.a * currentTransform.a + currentTransform.b * currentTransform.b)
    
    ctx.beginPath()
    this.drawShape(ctx, style.shape || 'rounded', x, y, width, height, radius)
    
    // 填充背景
    const bgColor = style.backgroundColor || '#fff'
    ctx.fillStyle = bgColor
    ctx.fill()
    
    // 绘制边框 - 根据缩放调整线宽
    const borderWidth = (style.borderWidth || 2) / scale
    const borderColor = style.borderColor || '#ddd'
    
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth
    
    if (style.borderStyle === 'dashed') {
      ctx.setLineDash([5 / scale, 5 / scale])
    } else if (style.borderStyle === 'dotted') {
      ctx.setLineDash([2 / scale, 2 / scale])
    }
    
    ctx.stroke()
    ctx.setLineDash([])
  }
  
  /**
   * 绘制形状
   */
  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: string,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    switch (shape) {
      case 'rect':
        ctx.rect(x, y, width, height)
        break
        
      case 'rounded':
        this.roundRect(ctx, x, y, width, height, radius)
        break
        
      case 'circle':
        const r = Math.min(width, height) / 2
        ctx.arc(x + width / 2, y + height / 2, r, 0, Math.PI * 2)
        break
        
      case 'ellipse':
        ctx.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          Math.PI * 2
        )
        break
        
      case 'diamond':
        ctx.moveTo(x + width / 2, y)
        ctx.lineTo(x + width, y + height / 2)
        ctx.lineTo(x + width / 2, y + height)
        ctx.lineTo(x, y + height / 2)
        ctx.closePath()
        break
        
      case 'hexagon':
        const w = width / 4
        ctx.moveTo(x + w, y)
        ctx.lineTo(x + width - w, y)
        ctx.lineTo(x + width, y + height / 2)
        ctx.lineTo(x + width - w, y + height)
        ctx.lineTo(x + w, y + height)
        ctx.lineTo(x, y + height / 2)
        ctx.closePath()
        break
        
      default:
        this.roundRect(ctx, x, y, width, height, radius)
    }
  }
  
  /**
   * 绘制圆角矩形
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
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
  }
  
  /**
   * 绘制节点文本
   */
  private drawNodeText(ctx: CanvasRenderingContext2D, node: NodeData, style: any): void {
    const fontSize = style.fontSize || 14
    const fontFamily = style.fontFamily || 'Arial'
    const fontWeight = style.fontWeight || 'normal'
    const color = style.color || '#333'
    
    // 保存当前状态
    ctx.save()
    
    // 重置缩放以保持文本清晰
    const currentTransform = ctx.getTransform()
    const scale = Math.sqrt(currentTransform.a * currentTransform.a + currentTransform.b * currentTransform.b)
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 文本换行
    const maxWidth = node.width! - 20
    const lines = this.wrapText(node.label, maxWidth, ctx)
    const lineHeight = fontSize * 1.2
    const totalHeight = lines.length * lineHeight
    const startY = -totalHeight / 2 + lineHeight / 2
    
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, startY + i * lineHeight)
    })
    
    ctx.restore()
  }
  
  /**
   * 文本换行
   */
  private wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
    const words = text.split('')
    const lines: string[] = []
    let currentLine = ''
    
    for (const char of words) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines.length > 0 ? lines : [text]
  }
  
  /**
   * 绘制折叠指示器
   */
  private drawCollapseIndicator(node: NodeData, style: any): void {
    // 获取当前缩放比例
    const currentTransform = this.ctx.getTransform()
    const scale = Math.sqrt(currentTransform.a * currentTransform.a + currentTransform.b * currentTransform.b)
    
    const x = node.width! / 2 + 8
    const y = 0
    const size = 12
    
    this.ctx.beginPath()
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    this.ctx.fillStyle = node.collapsed ? '#999' : '#4a90e2'
    this.ctx.fill()
    
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2 / scale
    this.ctx.beginPath()
    this.ctx.moveTo(x - 3, y)
    this.ctx.lineTo(x + 3, y)
    if (node.collapsed) {
      this.ctx.moveTo(x, y - 3)
      this.ctx.lineTo(x, y + 3)
    }
    this.ctx.stroke()
  }
  
  /**
   * 渲染连线
   */
  private renderEdges(node: NodeData, theme?: any): void {
    if (!node.children || node.collapsed) return
    
    const edgeStyle = theme?.edgeStyle || DEFAULT_CONFIG.EDGE
    
    for (const child of node.children) {
      if (child.x !== undefined && child.y !== undefined) {
        this.drawEdge(node, child, edgeStyle)
        this.renderEdges(child, theme)
      }
    }
  }
  
  /**
   * 计算节点边缘的连接点（智能选择连接方向）
   */
  private getEdgePoint(node: NodeData, targetX: number, targetY: number): { x: number; y: number } {
    const nodeX = node.x!
    const nodeY = node.y!
    const halfWidth = (node.width || 100) / 2
    const halfHeight = (node.height || 40) / 2
    
    // 计算从节点中心到目标点的方向
    const dx = targetX - nodeX
    const dy = targetY - nodeY
    
    // 判断主要方向（水平优先）
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    
    let x, y
    
    // 如果水平距离大于垂直距离，优先使用左右连接点
    if (absX > absY) {
      // 从左边或右边连接
      x = nodeX + (dx > 0 ? halfWidth : -halfWidth)
      y = nodeY
    } else {
      // 从上边或下边连接
      x = nodeX
      y = nodeY + (dy > 0 ? halfHeight : -halfHeight)
    }
    
    return { x, y }
  }

  /**
   * 绘制连线
   */
  private drawEdge(from: NodeData, to: NodeData, style: EdgeStyle): void {
    this.ctx.save()
    
    // 获取当前缩放比例，调整线宽以保持视觉一致性
    const currentTransform = this.ctx.getTransform()
    const scale = Math.sqrt(currentTransform.a * currentTransform.a + currentTransform.b * currentTransform.b)
    
    this.ctx.strokeStyle = style.color || '#999'
    this.ctx.lineWidth = (style.width || 2) / scale
    
    if (style.style === 'dashed') {
      this.ctx.setLineDash([5 / scale, 5 / scale])
    } else if (style.style === 'dotted') {
      this.ctx.setLineDash([2 / scale, 2 / scale])
    }
    
    // 计算连线的起点和终点（从节点边缘开始）
    const startPoint = this.getEdgePoint(from, to.x!, to.y!)
    const endPoint = this.getEdgePoint(to, from.x!, from.y!)
    
    this.ctx.beginPath()
    
    const curve = style.curve || 'bezier'
    
    switch (curve) {
      case 'straight':
        this.ctx.moveTo(startPoint.x, startPoint.y)
        this.ctx.lineTo(endPoint.x, endPoint.y)
        break
        
      case 'bezier':
        this.drawBezierCurveWithPoints(startPoint, endPoint)
        break
        
      case 'polyline':
        this.drawPolylineWithPoints(startPoint, endPoint)
        break
        
      case 'arc':
        this.drawArcWithPoints(startPoint, endPoint)
        break
    }
    
    this.ctx.stroke()
    this.ctx.setLineDash([])
    
    // 绘制箭头
    if (style.arrow) {
      this.drawArrowAtPoint(startPoint, endPoint, (style.arrowSize || 8) / scale)
    }
    
    this.ctx.restore()
  }
  
  /**
   * 绘制贝塞尔曲线（使用边缘点）
   */
  private drawBezierCurveWithPoints(start: { x: number; y: number }, end: { x: number; y: number }): void {
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    const cp1x = start.x + dx * 0.5
    const cp1y = start.y
    const cp2x = end.x - dx * 0.5
    const cp2y = end.y
    
    this.ctx.moveTo(start.x, start.y)
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y)
  }
  
  /**
   * 绘制折线（使用边缘点）
   */
  private drawPolylineWithPoints(start: { x: number; y: number }, end: { x: number; y: number }): void {
    const midX = (start.x + end.x) / 2
    
    this.ctx.moveTo(start.x, start.y)
    this.ctx.lineTo(midX, start.y)
    this.ctx.lineTo(midX, end.y)
    this.ctx.lineTo(end.x, end.y)
  }
  
  /**
   * 绘制弧线（使用边缘点）
   */
  private drawArcWithPoints(start: { x: number; y: number }, end: { x: number; y: number }): void {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    this.ctx.moveTo(start.x, start.y)
    this.ctx.arcTo(
      start.x + dx / 2,
      start.y + dy / 2 - distance / 4,
      end.x,
      end.y,
      distance / 2
    )
  }
  
  /**
   * 绘制箭头（使用边缘点）
   */
  private drawArrowAtPoint(start: { x: number; y: number }, end: { x: number; y: number }, size: number): void {
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    
    this.ctx.save()
    this.ctx.translate(end.x, end.y)
    this.ctx.rotate(angle)
    
    this.ctx.beginPath()
    this.ctx.moveTo(0, 0)
    this.ctx.lineTo(-size, -size / 2)
    this.ctx.lineTo(-size, size / 2)
    this.ctx.closePath()
    this.ctx.fill()
    
    this.ctx.restore()
  }
  
  /**
   * 绘制贝塞尔曲线（旧方法，保留兼容性）
   */
  private drawBezierCurve(from: NodeData, to: NodeData): void {
    const dx = to.x! - from.x!
    const dy = to.y! - from.y!
    
    const cp1x = from.x! + dx * 0.5
    const cp1y = from.y!
    const cp2x = to.x! - dx * 0.5
    const cp2y = to.y!
    
    this.ctx.moveTo(from.x!, from.y!)
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x!, to.y!)
  }
  
  /**
   * 绘制折线（旧方法，保留兼容性）
   */
  private drawPolyline(from: NodeData, to: NodeData): void {
    const midX = (from.x! + to.x!) / 2
    
    this.ctx.moveTo(from.x!, from.y!)
    this.ctx.lineTo(midX, from.y!)
    this.ctx.lineTo(midX, to.y!)
    this.ctx.lineTo(to.x!, to.y!)
  }
  
  /**
   * 绘制弧线（旧方法，保留兼容性）
   */
  private drawArc(from: NodeData, to: NodeData): void {
    const dx = to.x! - from.x!
    const dy = to.y! - from.y!
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    this.ctx.moveTo(from.x!, from.y!)
    this.ctx.arcTo(
      from.x! + dx / 2,
      from.y! + dy / 2 - distance / 4,
      to.x!,
      to.y!,
      distance / 2
    )
  }
  
  /**
   * 绘制箭头（旧方法，保留兼容性）
   */
  private drawArrow(from: NodeData, to: NodeData, size: number): void {
    const angle = Math.atan2(to.y! - from.y!, to.x! - from.x!)
    
    this.ctx.save()
    this.ctx.translate(to.x!, to.y!)
    this.ctx.rotate(angle)
    
    this.ctx.beginPath()
    this.ctx.moveTo(0, 0)
    this.ctx.lineTo(-size, -size / 2)
    this.ctx.lineTo(-size, size / 2)
    this.ctx.closePath()
    this.ctx.fill()
    
    this.ctx.restore()
  }
  
  /**
   * 设置变换
   */
  setTransform(x: number, y: number, scale: number): void {
    this.transform = { x, y, scale }
  }
  
  /**
   * 获取变换
   */
  getTransform(): { x: number; y: number; scale: number } {
    return { ...this.transform }
  }
  
  /**
   * 调整画布大小
   */
  resize(): void {
    this.setupCanvas()
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.nodeCache.clear()
  }
  
  /**
   * 获取节点样式
   */
  private getNodeStyle(node: NodeData, level: number, theme?: any): any {
    // 合并默认样式
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
      shape: DEFAULT_CONFIG.NODE.shape,
    }
    
    // 如果节点有自定义样式，合并它
    if (node.style) {
      return Object.assign({}, defaultStyle, node.style)
    }
    
    // 如果有主题样式，使用主题样式
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
    
    // 返回默认样式
    return defaultStyle
  }
}

