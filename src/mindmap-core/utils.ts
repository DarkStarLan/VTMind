/**
 * 工具函数
 */

import type { NodeData, NodeStyle } from './types'

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深度克隆
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * 合并对象
 */
export function merge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  for (const source of sources) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const value = source[key]
        if (value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            target[key] = merge(target[key] || {} as any, value as any)
          } else {
            target[key] = value as any
          }
        }
      }
    }
  }
  return target
}

/**
 * 遍历树
 */
export function traverseTree(
  node: NodeData,
  callback: (node: NodeData, level: number, parent?: NodeData) => void | boolean,
  level = 0,
  parent?: NodeData
): void {
  const result = callback(node, level, parent)
  if (result === false) return
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      traverseTree(child, callback, level + 1, node)
    }
  }
}

/**
 * 查找节点
 */
export function findNode(root: NodeData, predicate: (node: NodeData) => boolean): NodeData | null {
  let found: NodeData | null = null
  
  traverseTree(root, (node) => {
    if (predicate(node)) {
      found = node
      return false
    }
  })
  
  return found
}

/**
 * 查找节点路径
 */
export function findNodePath(root: NodeData, nodeId: string): NodeData[] | null {
  const path: NodeData[] = []
  
  function search(node: NodeData): boolean {
    path.push(node)
    
    if (node.id === nodeId) {
      return true
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (search(child)) {
          return true
        }
      }
    }
    
    path.pop()
    return false
  }
  
  return search(root) ? path : null
}

/**
 * 获取节点层级
 */
export function getNodeLevel(root: NodeData, nodeId: string): number {
  let level = -1
  
  traverseTree(root, (node, l) => {
    if (node.id === nodeId) {
      level = l
      return false
    }
  })
  
  return level
}

/**
 * 获取所有叶子节点
 */
export function getLeafNodes(root: NodeData): NodeData[] {
  const leaves: NodeData[] = []
  
  traverseTree(root, (node) => {
    if (!node.children || node.children.length === 0) {
      leaves.push(node)
    }
  })
  
  return leaves
}

/**
 * 计算树的深度
 */
export function getTreeDepth(node: NodeData): number {
  if (!node.children || node.children.length === 0) {
    return 1
  }
  
  return 1 + Math.max(...node.children.map(child => getTreeDepth(child)))
}

/**
 * 计算树的宽度（叶子节点数量）
 */
export function getTreeWidth(node: NodeData): number {
  if (!node.children || node.children.length === 0) {
    return 1
  }
  
  return node.children.reduce((sum, child) => sum + getTreeWidth(child), 0)
}

/**
 * 获取节点的所有后代
 */
export function getDescendants(node: NodeData): NodeData[] {
  const descendants: NodeData[] = []
  
  traverseTree(node, (n, level) => {
    if (level > 0) {
      descendants.push(n)
    }
  })
  
  return descendants
}

/**
 * 获取节点的所有祖先
 */
export function getAncestors(root: NodeData, nodeId: string): NodeData[] {
  const path = findNodePath(root, nodeId)
  return path ? path.slice(0, -1) : []
}

/**
 * 计算文本宽度
 */
export function measureText(
  text: string,
  fontSize: number = 14,
  fontFamily: string = 'Arial'
): number {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `${fontSize}px ${fontFamily}`
  return ctx.measureText(text).width
}

/**
 * 计算节点尺寸
 */
export function calculateNodeSize(
  node: NodeData,
  style: any
): { width: number; height: number } {
  const fontSize = style.fontSize || style.FONT_SIZE || 14
  const fontFamily = style.fontFamily || style.FONT_FAMILY || 'Arial'
  const padding = normalizePadding(style.padding || style.PADDING || [8, 16])
  
  const textWidth = measureText(node.label, fontSize, fontFamily)
  const width = Math.max(textWidth + padding[1] + padding[3], 60) // 最小宽度 60
  const height = Math.max(fontSize * 1.5 + padding[0] + padding[2], 30) // 最小高度 30
  
  return { width, height }
}

/**
 * 标准化 padding
 */
export function normalizePadding(
  padding: number | [number, number] | [number, number, number, number]
): [number, number, number, number] {
  if (typeof padding === 'number') {
    return [padding, padding, padding, padding]
  }
  if (padding.length === 2) {
    return [padding[0], padding[1], padding[0], padding[1]]
  }
  return padding
}

/**
 * 点是否在矩形内
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  )
}

/**
 * 矩形是否相交
 */
export function isRectIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

/**
 * 计算两点距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * 计算贝塞尔曲线点
 */
export function bezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): { x: number; y: number } {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  }
}

/**
 * 节流
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  let previous = 0
  
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = window.setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 防抖
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = window.setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * 颜色转换：hex to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 下载文件
 */
export function downloadFile(content: string | Blob, filename: string): void {
  const blob = typeof content === 'string' ? new Blob([content]) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

