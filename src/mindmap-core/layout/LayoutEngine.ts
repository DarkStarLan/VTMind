/**
 * 布局引擎 - 负责计算节点位置
 */

import type { NodeData, LayoutConfig, LayoutType } from '../types'
import { getTreeDepth, getTreeWidth, calculateNodeSize } from '../utils'
import { DEFAULT_CONFIG } from '../constants'

export class LayoutEngine {
  private config: Required<LayoutConfig>
  private hasValidPositions: boolean = false
  
  constructor(config: LayoutConfig) {
    this.config = {
      type: config.type || 'mindmap',
      nodeSpacing: config.nodeSpacing || DEFAULT_CONFIG.LAYOUT.NODE_SPACING,
      levelSpacing: config.levelSpacing || DEFAULT_CONFIG.LAYOUT.LEVEL_SPACING,
      branchSpacing: config.branchSpacing || DEFAULT_CONFIG.LAYOUT.BRANCH_SPACING,
      align: config.align || 'center',
      direction: config.direction || 'horizontal',
      preservePosition: config.preservePosition || false,
      customLayout: config.customLayout,
    }
  }
  
  /**
   * 执行布局计算
   */
  layout(root: NodeData, theme?: any): void {
    // 检查是否所有节点都有有效的位置信息
    this.hasValidPositions = this.checkValidPositions(root)
    
    // 如果配置了保留位置且所有节点都有有效位置，则跳过布局计算
    if (this.config.preservePosition && this.hasValidPositions) {
      // 只计算节点尺寸，不改变位置
      this.calculateSizesOnly(root, theme)
      return
    }
    
    if (this.config.customLayout) {
      this.config.customLayout(this.getAllNodes(root), root)
      return
    }
    
    switch (this.config.type) {
      case 'tree-right':
        this.treeLayout(root, 'right', theme)
        break
      case 'tree-left':
        this.treeLayout(root, 'left', theme)
        break
      case 'tree-down':
        this.treeLayout(root, 'down', theme)
        break
      case 'tree-up':
        this.treeLayout(root, 'up', theme)
        break
      case 'mindmap':
        this.mindmapLayout(root, theme)
        break
      case 'radial':
        this.radialLayout(root, theme)
        break
      case 'org-chart':
        this.orgChartLayout(root, theme)
        break
      default:
        this.treeLayout(root, 'right', theme)
    }
  }
  
  /**
   * 检查节点是否都有有效的位置信息
   */
  private checkValidPositions(node: NodeData): boolean {
    if (node.x === undefined || node.y === undefined) {
      return false
    }
    
    if (node.children && !node.collapsed) {
      for (const child of node.children) {
        if (!this.checkValidPositions(child)) {
          return false
        }
      }
    }
    
    return true
  }
  
  /**
   * 只计算节点尺寸，不改变位置
   */
  private calculateSizesOnly(node: NodeData, theme?: any, level: number = 0): void {
    const style = this.getNodeStyle(node, level, theme)
    const size = calculateNodeSize(node, style)
    node.width = size.width
    node.height = size.height
    
    if (node.children && !node.collapsed) {
      for (const child of node.children) {
        this.calculateSizesOnly(child, theme, level + 1)
      }
    }
  }
  
  /**
   * 树形布局
   */
  private treeLayout(root: NodeData, direction: 'right' | 'left' | 'down' | 'up', theme?: any): void {
    const isHorizontal = direction === 'right' || direction === 'left'
    const isReverse = direction === 'left' || direction === 'up'
    
    // 先计算根节点尺寸
    const rootStyle = this.getNodeStyle(root, 0, theme)
    const rootSize = calculateNodeSize(root, rootStyle)
    root.width = rootSize.width
    root.height = rootSize.height
    root.x = 0
    root.y = 0
    
    if (!root.children || root.children.length === 0) return
    
    // 计算起始位置
    const startPos = isHorizontal
      ? this.config.levelSpacing + root.width / 2
      : this.config.levelSpacing + root.height / 2
    
    // 使用累积位置的布局方法
    this.treeLayoutWithPos(root.children, 1, 0, startPos, direction, theme)
  }
  
  /**
   * 树形布局（带累积位置和动态距离）
   */
  private treeLayoutWithPos(
    nodes: NodeData[],
    level: number,
    offset: number,
    currentPos: number,
    direction: 'right' | 'left' | 'down' | 'up',
    theme?: any,
    parentPos: number = 0
  ): number {
    if (nodes.length === 0) return 0
    
    const isHorizontal = direction === 'right' || direction === 'left'
    const isReverse = direction === 'left' || direction === 'up'
    
    const nodeSizes: number[] = []
    let totalSize = 0
    let maxDimension = 0
    
    // 先计算所有节点的尺寸
    for (const node of nodes) {
      const style = this.getNodeStyle(node, level, theme)
      const size = calculateNodeSize(node, style)
      node.width = size.width
      node.height = size.height
      
      const nodeDimension = isHorizontal ? node.width! : node.height!
      maxDimension = Math.max(maxDimension, nodeDimension)
      
      let childrenSize = 0
      if (node.children && node.children.length > 0 && !node.collapsed) {
        childrenSize = this.calculateTreeSize(node.children, level + 1, direction, theme)
      }
      
      const perpDimension = isHorizontal ? node.height! : node.width!
      const nodeOccupiedSize = perpDimension + this.config.nodeSpacing
      const nodeSize = Math.max(nodeOccupiedSize, childrenSize)
      nodeSizes.push(nodeSize)
      totalSize += nodeSize
    }
    
    // 添加节点之间的间距
    totalSize += (nodes.length - 1) * this.config.nodeSpacing
    
    // 计算每个节点的偏移量
    const offsets: number[] = []
    let currentOffset = offset - totalSize / 2
    for (let i = 0; i < nodes.length; i++) {
      offsets.push(currentOffset + nodeSizes[i] / 2)
      currentOffset += nodeSizes[i] + this.config.nodeSpacing
    }
    
    // 计算这一组节点的最大垂直距离（用于统一的额外距离）
    let maxPerpendicularDistance = 0
    for (let i = 0; i < nodes.length; i++) {
      const perpendicularDistance = Math.abs(offsets[i] - parentPos)
      maxPerpendicularDistance = Math.max(maxPerpendicularDistance, perpendicularDistance)
    }
    
    // 根据最大垂直距离计算统一的额外距离
    // 降低系数从 10 到 3，避免树形布局过于分散
    const extraDistance = Math.sqrt(maxPerpendicularDistance) * 3
    
    // 应用额外距离
    const adjustedPos = currentPos + extraDistance
    
    // 设置节点位置并递归布局子节点
    nodes.forEach((node, i) => {
      if (isHorizontal) {
        node.x = isReverse ? -adjustedPos : adjustedPos
        node.y = offsets[i]
      } else {
        node.x = offsets[i]
        node.y = isReverse ? -adjustedPos : adjustedPos
      }
      
      // 递归布局子节点
      if (node.children && node.children.length > 0 && !node.collapsed) {
        const nextPos = adjustedPos + this.config.levelSpacing + maxDimension
        this.treeLayoutWithPos(node.children, level + 1, offsets[i], nextPos, direction, theme, offsets[i])
      }
    })
    
    return totalSize
  }
      
  /**
   * 计算树形布局的尺寸
   */
  private calculateTreeSize(
    nodes: NodeData[],
    level: number,
    direction: 'right' | 'left' | 'down' | 'up',
    theme?: any
  ): number {
    if (nodes.length === 0) return 0
    
    const isHorizontal = direction === 'right' || direction === 'left'
    let totalSize = 0
    
    for (const node of nodes) {
      const style = this.getNodeStyle(node, level, theme)
      const size = calculateNodeSize(node, style)
      
      let childrenSize = 0
      if (node.children && node.children.length > 0 && !node.collapsed) {
        childrenSize = this.calculateTreeSize(node.children, level + 1, direction, theme)
    }
    
      const perpDimension = isHorizontal ? size.height : size.width
      const nodeOccupiedSize = perpDimension + this.config.nodeSpacing
      const nodeSize = Math.max(nodeOccupiedSize, childrenSize)
      totalSize += nodeSize
    }
    
    totalSize += (nodes.length - 1) * this.config.nodeSpacing
    return totalSize
  }
  
  /**
   * 思维导图布局（左右分布）
   */
  private mindmapLayout(root: NodeData, theme?: any): void {
    const style = this.getNodeStyle(root, 0, theme)
    const size = calculateNodeSize(root, style)
    root.width = size.width
    root.height = size.height
    root.x = 0
    root.y = 0
    
    if (!root.children || root.children.length === 0) return
    
    // 分成左右两部分
    const leftChildren = root.children.filter((_, i) => i % 2 === 0)
    const rightChildren = root.children.filter((_, i) => i % 2 === 1)
    
    // 根据子节点数量动态计算基础距离
    // 子节点越多，需要的水平距离越大
    const maxChildren = Math.max(leftChildren.length, rightChildren.length)
    const distanceMultiplier = 1.5 + Math.min(maxChildren * 0.35, 2.5) // 最多增加到4倍
    const baseStartX = this.config.levelSpacing * distanceMultiplier + root.width / 2
    
    // 布局右侧（传入根节点中心 Y 坐标 0）
    this.layoutBranchWithDynamicX(rightChildren, 1, 0, baseStartX, 'right', theme, 0)
    
    // 布局左侧（传入根节点中心 Y 坐标 0）
    this.layoutBranchWithDynamicX(leftChildren, 1, 0, -baseStartX, 'left', theme, 0)
  }
  
  /**
   * 布局分支（带动态 X 坐标，根据竖直距离调整）
   */
  private layoutBranchWithDynamicX(
    nodes: NodeData[],
    level: number,
    offset: number,
    baseX: number,
    side: 'left' | 'right',
    theme?: any,
    parentY: number = 0
  ): number {
    if (nodes.length === 0) return 0
    
    const nodeSizes: number[] = []
    const childrenHeights: number[] = []
    const nodeWidths: number[] = []
    let totalHeight = 0
    let maxWidth = 0
    
    // 先计算所有节点和子树的尺寸
    for (const node of nodes) {
      const style = this.getNodeStyle(node, level, theme)
      const size = calculateNodeSize(node, style)
      node.width = size.width
      node.height = size.height
      nodeWidths.push(size.width)
      maxWidth = Math.max(maxWidth, size.width)
      
      let childrenHeight = 0
      if (node.children && node.children.length > 0 && !node.collapsed) {
        // 先递归计算子树高度，但不设置位置
        childrenHeight = this.calculateBranchHeight(node.children, level + 1, side, theme)
      }
      
      childrenHeights.push(childrenHeight)
      // 节点占用的高度 = max(节点自身高度 + 固定间距, 子树高度)
      const nodeOccupiedHeight = node.height! + this.config.nodeSpacing
      const nodeHeight = Math.max(nodeOccupiedHeight, childrenHeight)
      nodeSizes.push(nodeHeight)
      totalHeight += nodeHeight
    }
    
    // 添加节点之间的间距
    totalHeight += (nodes.length - 1) * this.config.nodeSpacing
    
    // 计算每个节点的偏移量（从上到下居中对齐）
    const offsets: number[] = []
    let currentOffset = offset - totalHeight / 2
    for (let i = 0; i < nodes.length; i++) {
      offsets.push(currentOffset + nodeSizes[i] / 2)
      currentOffset += nodeSizes[i] + this.config.nodeSpacing
    }
    
    // 计算这一组节点的最大竖直距离（用于统一的水平距离）
    let maxVerticalDistance = 0
    for (let i = 0; i < nodes.length; i++) {
      const verticalDistance = Math.abs(offsets[i] - parentY)
      maxVerticalDistance = Math.max(maxVerticalDistance, verticalDistance)
    }
    
    // 根据最大竖直距离计算统一的额外水平距离
    const extraHorizontalDistance = Math.sqrt(maxVerticalDistance) * 4
    
    // 应用统一的水平距离到所有节点
    const currentX = side === 'right'
      ? baseX + extraHorizontalDistance
      : baseX - extraHorizontalDistance
    
    // 设置节点位置并递归布局子节点
    nodes.forEach((node, i) => {
      node.x = currentX
      node.y = offsets[i]
      
      // 递归布局子节点，传入累积的 X 坐标
      if (node.children && node.children.length > 0 && !node.collapsed) {
        // 计算下一层的 X 坐标：当前 X + 层级间距 + 当前层最大宽度
        const nextBaseX = side === 'right'
          ? currentX + this.config.levelSpacing + maxWidth
          : currentX - this.config.levelSpacing - maxWidth
        
        // 递归时传入当前节点的 Y 坐标作为子节点的父 Y 坐标
        this.layoutBranchWithDynamicX(node.children, level + 1, offsets[i], nextBaseX, side, theme, offsets[i])
      }
    })
    
    return totalHeight
  }
  
  /**
   * 布局分支（带累积 X 坐标）
   */
  private layoutBranchWithX(
    nodes: NodeData[],
    level: number,
    offset: number,
    currentX: number,
    side: 'left' | 'right',
    theme?: any
  ): number {
    if (nodes.length === 0) return 0
    
    const nodeSizes: number[] = []
    const childrenHeights: number[] = []
    const nodeWidths: number[] = []
    let totalHeight = 0
    let maxWidth = 0
    
    // 先计算所有节点和子树的尺寸
    for (const node of nodes) {
      const style = this.getNodeStyle(node, level, theme)
      const size = calculateNodeSize(node, style)
      node.width = size.width
      node.height = size.height
      nodeWidths.push(size.width)
      maxWidth = Math.max(maxWidth, size.width)
      
      let childrenHeight = 0
      if (node.children && node.children.length > 0 && !node.collapsed) {
        // 先递归计算子树高度，但不设置位置
        childrenHeight = this.calculateBranchHeight(node.children, level + 1, side, theme)
      }
      
      childrenHeights.push(childrenHeight)
      // 节点占用的高度 = max(节点自身高度 + 固定间距, 子树高度)
      const nodeOccupiedHeight = node.height! + this.config.nodeSpacing
      const nodeHeight = Math.max(nodeOccupiedHeight, childrenHeight)
      nodeSizes.push(nodeHeight)
      totalHeight += nodeHeight
    }
    
    // 添加节点之间的间距
    totalHeight += (nodes.length - 1) * this.config.nodeSpacing
    
    // 计算每个节点的偏移量（从上到下居中对齐）
    const offsets: number[] = []
    let currentOffset = offset - totalHeight / 2
    for (let i = 0; i < nodes.length; i++) {
      offsets.push(currentOffset + nodeSizes[i] / 2)
      currentOffset += nodeSizes[i] + this.config.nodeSpacing
    }
    
    // 设置节点位置并递归布局子节点
    nodes.forEach((node, i) => {
      node.x = currentX
      node.y = offsets[i]
      
      // 递归布局子节点，传入累积的 X 坐标
      if (node.children && node.children.length > 0 && !node.collapsed) {
        // 计算竖直距离（节点到父节点中心的距离）
        const verticalDistance = Math.abs(offsets[i] - offset)
        
        // 根据竖直距离计算额外的水平距离
        // 竖直距离越大，额外的水平距离越大
        // 使用平方根函数使增长更平缓，避免距离过大
        const extraHorizontalDistance = Math.sqrt(verticalDistance) * 4
        
        // 计算下一层的 X 坐标：当前 X + 层级间距 + 当前层最大宽度 + 额外距离
        const nextX = side === 'right'
          ? currentX + this.config.levelSpacing + maxWidth + extraHorizontalDistance
          : currentX - this.config.levelSpacing - maxWidth - extraHorizontalDistance
        
        this.layoutBranchWithX(node.children, level + 1, offsets[i], nextX, side, theme)
      }
    })
    
    return totalHeight
  }
  
  /**
   * 计算分支高度（不设置位置）
   */
  private calculateBranchHeight(
    nodes: NodeData[],
    level: number,
    side: 'left' | 'right',
    theme?: any
  ): number {
    if (nodes.length === 0) return 0
    
    let totalHeight = 0
    
    for (const node of nodes) {
      const style = this.getNodeStyle(node, level, theme)
      const size = calculateNodeSize(node, style)
      
      let childrenHeight = 0
      if (node.children && node.children.length > 0 && !node.collapsed) {
        childrenHeight = this.calculateBranchHeight(node.children, level + 1, side, theme)
      }
      
      // 节点占用的高度 = max(节点自身高度 + 固定间距, 子树高度)
      const nodeOccupiedHeight = size.height + this.config.nodeSpacing
      const nodeHeight = Math.max(nodeOccupiedHeight, childrenHeight)
      totalHeight += nodeHeight
    }
    
    // 添加节点之间的间距
    totalHeight += (nodes.length - 1) * this.config.nodeSpacing
    
    return totalHeight
  }
  
  /**
   * 放射状布局（优化版，根据子节点数量动态调整半径）
   */
  private radialLayout(root: NodeData, theme?: any): void {
    const style = this.getNodeStyle(root, 0, theme)
    const size = calculateNodeSize(root, style)
    root.width = size.width
    root.height = size.height
    root.x = 0
    root.y = 0
    
    if (!root.children || root.children.length === 0) return
    
    // 根据子节点数量动态调整半径
    const childCount = root.children.length
    const baseRadius = 150 + Math.max(root.width, root.height) / 2
    const radiusMultiplier = 1 + Math.min(childCount * 0.15, 1.5)
    const radius = baseRadius * radiusMultiplier
    
    const angleStep = (2 * Math.PI) / childCount
    
    root.children.forEach((child, i) => {
      const angle = i * angleStep - Math.PI / 2
      const childStyle = this.getNodeStyle(child, 1, theme)
      const childSize = calculateNodeSize(child, childStyle)
      child.width = childSize.width
      child.height = childSize.height
      child.x = Math.cos(angle) * radius
      child.y = Math.sin(angle) * radius
      
      // 递归布局子节点
      if (child.children && child.children.length > 0 && !child.collapsed) {
        // 根据子节点数量动态调整下一层半径
        const childRadius = this.calculateRadialRadius(child.children.length, childSize)
        const nextRadius = radius + childRadius
        this.layoutRadialChildren(child, angle, nextRadius, 2, theme)
      }
    })
  }
  
  /**
   * 计算放射状布局的半径
   */
  private calculateRadialRadius(childCount: number, parentSize: { width: number; height: number }): number {
    const baseIncrement = 120
    const sizeIncrement = Math.max(parentSize.width, parentSize.height)
    const countMultiplier = 1 + Math.min(childCount * 0.1, 0.8)
    return (baseIncrement + sizeIncrement) * countMultiplier
  }
  
  /**
   * 递归布局放射状子节点（优化版）
   */
  private layoutRadialChildren(
    parent: NodeData,
    parentAngle: number,
    radius: number,
    level: number,
    theme?: any
  ): void {
    if (!parent.children || parent.children.length === 0) return
    
    // 根据层级和子节点数量动态调整角度范围
    const childCount = parent.children.length
    const baseAngleRange = Math.PI / Math.max(level, 2)
    const angleRangeMultiplier = 1 + Math.min(childCount * 0.05, 0.5)
    const angleRange = baseAngleRange * angleRangeMultiplier
    
    const angleStep = childCount > 1 
      ? angleRange / (childCount - 1)
      : 0
    const startAngle = parentAngle - angleRange / 2
    
    let maxChildSize = 0
    
    parent.children.forEach((child, i) => {
      const angle = startAngle + i * angleStep
      const childStyle = this.getNodeStyle(child, level, theme)
      const childSize = calculateNodeSize(child, childStyle)
      child.width = childSize.width
      child.height = childSize.height
      maxChildSize = Math.max(maxChildSize, childSize.width, childSize.height)
      
      child.x = parent.x! + Math.cos(angle) * radius
      child.y = parent.y! + Math.sin(angle) * radius
      
      if (child.children && child.children.length > 0 && !child.collapsed) {
        const childRadius = this.calculateRadialRadius(child.children.length, childSize)
        const nextRadius = radius + childRadius
        this.layoutRadialChildren(child, angle, nextRadius, level + 1, theme)
      }
    })
  }
  
  /**
   * 组织架构图布局
   */
  private orgChartLayout(root: NodeData, theme?: any): void {
    this.treeLayout(root, 'down', theme)
  }
  
  /**
   * 获取所有节点
   */
  private getAllNodes(root: NodeData): NodeData[] {
    const nodes: NodeData[] = []
    const traverse = (node: NodeData) => {
      nodes.push(node)
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    traverse(root)
    return nodes
  }
  
  /**
   * 获取节点样式
   */
  private getNodeStyle(node: NodeData, level: number, theme?: any): any {
    if (node.style) return node.style
    
    if (theme?.nodeStyles) {
      if (level === 0 && theme.nodeStyles.root) return theme.nodeStyles.root
      if (level === 1 && theme.nodeStyles.level1) return theme.nodeStyles.level1
      if (level === 2 && theme.nodeStyles.level2) return theme.nodeStyles.level2
      if (theme.nodeStyles.default) return theme.nodeStyles.default
    }
    
    return DEFAULT_CONFIG.NODE
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    Object.assign(this.config, config)
  }
  
  /**
   * 获取配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config }
  }
}

