/**
 * 事件管理器 - 负责处理用户交互
 */

import type { NodeData, EventType, EventHandler, MindMapEvent } from '../types'
import { isPointInRect } from '../utils'

export class EventManager {
  private canvas: HTMLCanvasElement
  private listeners = new Map<EventType, Set<EventHandler>>()
  private transform = { x: 0, y: 0, scale: 1 }
  private isDragging = false
  private dragTarget: NodeData | null = null
  private dragStart = { x: 0, y: 0 }
  private lastMousePos = { x: 0, y: 0 }
  private hoveredNode: NodeData | null = null
  private selectedNodes = new Set<NodeData>()
  private isRightButtonDragging = false
  private dragButton: number = -1
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.bindEvents()
  }
  
  /**
   * 绑定事件
   */
  private bindEvents(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this))
    this.canvas.addEventListener('dblclick', this.handleDblClick.bind(this))
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this))
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
    
    // 键盘事件
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }
  
  /**
   * 点击事件
   */
  private handleClick(e: MouseEvent): void {
    const pos = this.getCanvasPosition(e)
    
    // 先检查是否点击了任何节点的折叠指示器
    const collapseNode = this.getCollapseIndicatorNodeAtPosition(pos.x, pos.y)
    if (collapseNode) {
      // 点击了折叠指示器，触发折叠/展开事件
      const eventType = collapseNode.collapsed ? 'node:expand' : 'node:collapse'
      console.log('Collapse indicator clicked, emitting:', eventType, collapseNode.label)
      this.emit(eventType, {
        type: eventType,
        target: collapseNode,
        originalEvent: e,
      })
      return
    }
    
    // 再检查是否点击了节点
    const node = this.getNodeAtPosition(pos.x, pos.y)
    
    if (node) {
      // 处理节点点击
      if (!e.ctrlKey && !e.metaKey) {
        this.clearSelection()
      }
      
      this.selectNode(node)
      
      this.emit('node:click', {
        type: 'node:click',
        target: node,
        originalEvent: e,
      })
    } else {
      // 点击画布
      this.clearSelection()
      
      this.emit('canvas:click', {
        type: 'canvas:click',
        originalEvent: e,
      })
    }
  }
  
  /**
   * 双击事件
   */
  private handleDblClick(e: MouseEvent): void {
    const pos = this.getCanvasPosition(e)
    const node = this.getNodeAtPosition(pos.x, pos.y)
    
    if (node) {
      this.emit('node:dblclick', {
        type: 'node:dblclick',
        target: node,
        originalEvent: e,
      })
    }
  }
  
  /**
   * 右键菜单事件
   */
  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault()
    
    // 如果刚刚进行了右键拖拽，不显示右键菜单
    if (this.isRightButtonDragging) {
      this.isRightButtonDragging = false
      return
    }
    
    const pos = this.getCanvasPosition(e)
    const node = this.getNodeAtPosition(pos.x, pos.y)
    
    if (node) {
      this.emit('node:contextmenu', {
        type: 'node:contextmenu',
        target: node,
        originalEvent: e,
      })
    } else {
      this.emit('canvas:contextmenu', {
        type: 'canvas:contextmenu',
        originalEvent: e,
      })
    }
  }
  
  /**
   * 鼠标按下事件
   */
  private handleMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasPosition(e)
    const node = this.getNodeAtPosition(pos.x, pos.y)
    
    this.dragButton = e.button
    this.dragStart = { x: e.clientX, y: e.clientY }
    this.lastMousePos = { x: e.clientX, y: e.clientY }
    
    // 只有右键可以拖拽画布
    if (e.button === 2) {
      // 右键按下
      this.isDragging = true
      this.isRightButtonDragging = false // 初始化为false，移动后才设为true
    } else if (e.button === 0 && node) {
      // 左键只能拖拽节点
      this.isDragging = true
      this.dragTarget = node
      
      this.emit('node:dragstart', {
        type: 'node:dragstart',
        target: node,
        originalEvent: e,
      })
    }
  }
  
  /**
   * 鼠标移动事件
   */
  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getCanvasPosition(e)
    
    // 处理悬停
    const node = this.getNodeAtPosition(pos.x, pos.y)
    
    if (node !== this.hoveredNode) {
      if (this.hoveredNode) {
        this.hoveredNode.hovered = false
        this.emit('node:mouseleave', {
          type: 'node:mouseleave',
          target: this.hoveredNode,
          originalEvent: e,
        })
      }
      
      if (node) {
        node.hovered = true
        this.emit('node:mouseenter', {
          type: 'node:mouseenter',
          target: node,
          originalEvent: e,
        })
      }
      
      this.hoveredNode = node
    }
    
    // 处理拖拽
    if (this.isDragging) {
      const dx = e.clientX - this.lastMousePos.x
      const dy = e.clientY - this.lastMousePos.y
      
      // 检测是否有实际移动
      const hasMoved = Math.abs(dx) > 2 || Math.abs(dy) > 2
      
      if (this.dragTarget) {
        // 拖拽节点（左键）
        this.dragTarget.x! += dx / this.transform.scale
        this.dragTarget.y! += dy / this.transform.scale
        
        this.emit('node:drag', {
          type: 'node:drag',
          target: this.dragTarget,
          originalEvent: e,
          data: { dx, dy },
        })
      } else if (this.dragButton === 2) {
        // 右键拖拽画布
        if (hasMoved) {
          this.isRightButtonDragging = true
        }
        
        this.transform.x += dx
        this.transform.y += dy
        
        this.emit('canvas:pan', {
          type: 'canvas:pan',
          originalEvent: e,
          data: { dx, dy },
        })
      }
      
      this.lastMousePos = { x: e.clientX, y: e.clientY }
    }
    
    // 更新光标样式
    this.canvas.style.cursor = node ? 'pointer' : this.isDragging ? 'grabbing' : 'default'
  }
  
  /**
   * 鼠标抬起事件
   */
  private handleMouseUp(e: MouseEvent): void {
    if (this.isDragging && this.dragTarget) {
      this.emit('node:dragend', {
        type: 'node:dragend',
        target: this.dragTarget,
        originalEvent: e,
      })
    }
    
    this.isDragging = false
    this.dragTarget = null
    this.dragButton = -1
    this.canvas.style.cursor = 'default'
  }
  
  /**
   * 鼠标离开事件
   */
  private handleMouseLeave(e: MouseEvent): void {
    if (this.hoveredNode) {
      this.hoveredNode.hovered = false
      this.hoveredNode = null
    }
    
    this.isDragging = false
    this.dragTarget = null
    this.isRightButtonDragging = false
    this.dragButton = -1
    this.canvas.style.cursor = 'default'
  }
  
  /**
   * 滚轮事件（缩放）
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = this.transform.scale * delta
    
    // 限制缩放范围
    if (newScale < 0.1 || newScale > 5) return
    
    // 以鼠标位置为中心缩放
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // 计算鼠标在画布中的世界坐标（缩放前）
    const worldX = (mouseX - rect.width / 2 - this.transform.x) / this.transform.scale
    const worldY = (mouseY - rect.height / 2 - this.transform.y) / this.transform.scale
    
    // 更新缩放
    this.transform.scale = newScale
    
    // 计算新的偏移量，使鼠标位置保持不变
    this.transform.x = mouseX - rect.width / 2 - worldX * newScale
    this.transform.y = mouseY - rect.height / 2 - worldY * newScale
    
    this.emit('canvas:zoom', {
      type: 'canvas:zoom',
      originalEvent: e,
      data: { scale: newScale },
    })
  }
  
  /**
   * 键盘按下事件
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // 处理快捷键
    const key = this.getKeyString(e)
    
    // Delete/Backspace - 删除选中节点
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNodes.size > 0) {
      e.preventDefault()
      this.selectedNodes.forEach(node => {
        this.emit('node:remove', {
          type: 'node:remove',
          target: node,
          originalEvent: e,
        })
      })
    }
    
    // Ctrl+Z / Cmd+Z - 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      // 触发撤销事件
    }
    
    // Ctrl+Y / Cmd+Shift+Z - 重做
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
      e.preventDefault()
      // 触发重做事件
    }
    
    // Ctrl+A / Cmd+A - 全选
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      // 触发全选事件
    }
  }
  
  /**
   * 键盘抬起事件
   */
  private handleKeyUp(e: KeyboardEvent): void {
    // 可以在这里处理键盘抬起事件
  }
  
  /**
   * 获取键盘按键字符串
   */
  private getKeyString(e: KeyboardEvent): string {
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Control')
    if (e.metaKey) parts.push('Meta')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    parts.push(e.key)
    return parts.join('+')
  }
  
  /**
   * 获取画布坐标
   */
  private getCanvasPosition(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2 - this.transform.x) / this.transform.scale
    const y = (e.clientY - rect.top - rect.height / 2 - this.transform.y) / this.transform.scale
    return { x, y }
  }
  
  /**
   * 获取指定位置的节点
   */
  private getNodeAtPosition(x: number, y: number): NodeData | null {
    if (!this.rootNode) return null
    
    let found: NodeData | null = null
    
    const traverse = (node: NodeData) => {
      if (node.x !== undefined && node.y !== undefined && node.width && node.height) {
        const rect = {
          x: node.x - node.width / 2,
          y: node.y - node.height / 2,
          width: node.width,
          height: node.height,
        }
        
        if (isPointInRect(x, y, rect)) {
          found = node
        }
      }
      
      // 遍历所有子节点，不管是否折叠
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    
    traverse(this.rootNode)
    
    return found
  }
  
  /**
   * 检查点击位置是否在某个节点的折叠指示器上，返回该节点
   */
  private getCollapseIndicatorNodeAtPosition(x: number, y: number): NodeData | null {
    if (!this.rootNode) return null
    
    let foundNode: NodeData | null = null
    const indicatorRadius = 10 // 点击区域半径
    
    const traverse = (node: NodeData) => {
      // 如果节点有子节点，检查折叠指示器
      if (node.children && node.children.length > 0 && 
          node.x !== undefined && node.y !== undefined && node.width && node.height) {
        
        // 折叠指示器的位置
        const indicatorX = node.x + node.width / 2 + 8
        const indicatorY = node.y
        
        // 检查点击位置是否在圆形指示器内
        const dx = x - indicatorX
        const dy = y - indicatorY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance <= indicatorRadius) {
          foundNode = node
          return
        }
      }
      
      // 继续遍历子节点
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    
    traverse(this.rootNode)
    return foundNode
  }
  
  /**
   * 选中节点
   */
  private selectNode(node: NodeData): void {
    node.selected = true
    this.selectedNodes.add(node)
    
    this.emit('selection:change', {
      type: 'selection:change',
      data: { selected: Array.from(this.selectedNodes) },
    })
  }
  
  /**
   * 清除选择
   */
  private clearSelection(): void {
    this.selectedNodes.forEach(node => {
      node.selected = false
    })
    this.selectedNodes.clear()
    
    this.emit('selection:change', {
      type: 'selection:change',
      data: { selected: [] },
    })
  }
  
  /**
   * 监听事件
   */
  on(type: EventType, handler: EventHandler): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(handler)
  }
  
  /**
   * 取消监听
   */
  off(type: EventType, handler: EventHandler): void {
    const handlers = this.listeners.get(type)
    if (handlers) {
      handlers.delete(handler)
    }
  }
  
  /**
   * 触发事件
   */
  private emit(type: EventType, event: MindMapEvent): void {
    const handlers = this.listeners.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }
  
  /**
   * 设置根节点（用于节点查找）
   */
  private rootNode: NodeData | null = null
  
  setRootNode(root: NodeData): void {
    this.rootNode = root
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
   * 获取选中的节点
   */
  getSelectedNodes(): NodeData[] {
    return Array.from(this.selectedNodes)
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick.bind(this))
    this.canvas.removeEventListener('dblclick', this.handleDblClick.bind(this))
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu.bind(this))
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    
    this.listeners.clear()
    this.selectedNodes.clear()
  }
}

