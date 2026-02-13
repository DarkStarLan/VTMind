/**
 * 动画引擎 - 负责处理动画效果
 */

import type { NodeData, AnimationConfig } from '../types'
import { EASING_FUNCTIONS } from '../constants'

interface Animation {
  id: string
  node: NodeData
  from: any
  to: any
  duration: number
  easing: string
  startTime: number
  onUpdate?: (progress: number) => void
  onComplete?: () => void
}

export class AnimationEngine {
  private config: Required<AnimationConfig>
  private animations = new Map<string, Animation>()
  private rafId: number | null = null
  
  constructor(config: AnimationConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      duration: config.duration || 300,
      easing: config.easing || 'ease-out',
      nodeEnter: config.nodeEnter || 'fade',
      nodeExit: config.nodeExit || 'fade',
      nodeUpdate: config.nodeUpdate || 'morph',
      delay: config.delay || 0,
      stagger: config.stagger || 0,
    }
  }
  
  /**
   * 启动动画循环
   */
  start(): void {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.tick.bind(this))
    }
  }
  
  /**
   * 停止动画循环
   */
  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
  
  /**
   * 动画循环
   */
  private tick(timestamp: number): void {
    const completedAnimations: string[] = []
    
    this.animations.forEach((animation, id) => {
      const elapsed = timestamp - animation.startTime
      const progress = Math.min(elapsed / animation.duration, 1)
      
      // 应用缓动函数
      const easingFunc = EASING_FUNCTIONS[animation.easing as keyof typeof EASING_FUNCTIONS] || EASING_FUNCTIONS.linear
      const easedProgress = easingFunc(progress)
      
      // 更新动画
      this.updateAnimation(animation, easedProgress)
      
      // 调用更新回调
      if (animation.onUpdate) {
        animation.onUpdate(easedProgress)
      }
      
      // 检查是否完成
      if (progress >= 1) {
        completedAnimations.push(id)
        if (animation.onComplete) {
          animation.onComplete()
        }
      }
    })
    
    // 移除完成的动画
    completedAnimations.forEach(id => this.animations.delete(id))
    
    // 继续循环
    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(this.tick.bind(this))
    } else {
      this.rafId = null
    }
  }
  
  /**
   * 更新动画
   */
  private updateAnimation(animation: Animation, progress: number): void {
    const { node, from, to } = animation
    
    // 插值计算
    for (const key in to) {
      if (typeof to[key] === 'number' && typeof from[key] === 'number') {
        (node as any)[key] = from[key] + (to[key] - from[key]) * progress
      }
    }
  }
  
  /**
   * 添加动画
   */
  animate(
    node: NodeData,
    to: any,
    options: Partial<AnimationConfig> = {}
  ): Promise<void> {
    if (!this.config.enabled) {
      Object.assign(node, to)
      return Promise.resolve()
    }
    
    return new Promise((resolve) => {
      const id = `${node.id}_${Date.now()}`
      const from: any = {}
      
      // 记录初始值
      for (const key in to) {
        from[key] = (node as any)[key]
      }
      
      const animation: Animation = {
        id,
        node,
        from,
        to,
        duration: options.duration || this.config.duration,
        easing: options.easing || this.config.easing,
        startTime: performance.now() + (options.delay || this.config.delay),
        onComplete: resolve,
      }
      
      this.animations.set(id, animation)
      this.start()
    })
  }
  
  /**
   * 节点进入动画
   */
  animateNodeEnter(node: NodeData, delay: number = 0): Promise<void> {
    const type = this.config.nodeEnter
    
    switch (type) {
      case 'fade':
        return this.animateFadeIn(node, delay)
      case 'scale':
        return this.animateScaleIn(node, delay)
      case 'slide':
        return this.animateSlideIn(node, delay)
      case 'bounce':
        return this.animateBounceIn(node, delay)
      default:
        return Promise.resolve()
    }
  }
  
  /**
   * 节点退出动画
   */
  animateNodeExit(node: NodeData): Promise<void> {
    const type = this.config.nodeExit
    
    switch (type) {
      case 'fade':
        return this.animateFadeOut(node)
      case 'scale':
        return this.animateScaleOut(node)
      case 'slide':
        return this.animateSlideOut(node)
      default:
        return Promise.resolve()
    }
  }
  
  /**
   * 淡入动画
   */
  private animateFadeIn(node: NodeData, delay: number): Promise<void> {
    const originalOpacity = (node as any).opacity || 1
    ;(node as any).opacity = 0
    
    return this.animate(node, { opacity: originalOpacity }, { delay })
  }
  
  /**
   * 淡出动画
   */
  private animateFadeOut(node: NodeData): Promise<void> {
    return this.animate(node, { opacity: 0 })
  }
  
  /**
   * 缩放进入动画
   */
  private animateScaleIn(node: NodeData, delay: number): Promise<void> {
    const originalWidth = node.width
    const originalHeight = node.height
    
    node.width = 0
    node.height = 0
    
    return this.animate(
      node,
      { width: originalWidth, height: originalHeight },
      { delay, easing: 'ease-out' }
    )
  }
  
  /**
   * 缩放退出动画
   */
  private animateScaleOut(node: NodeData): Promise<void> {
    return this.animate(
      node,
      { width: 0, height: 0 },
      { easing: 'ease-in' }
    )
  }
  
  /**
   * 滑入动画
   */
  private animateSlideIn(node: NodeData, delay: number): Promise<void> {
    const originalX = node.x!
    node.x = originalX - 100
    
    return this.animate(node, { x: originalX }, { delay })
  }
  
  /**
   * 滑出动画
   */
  private animateSlideOut(node: NodeData): Promise<void> {
    const targetX = node.x! + 100
    return this.animate(node, { x: targetX })
  }
  
  /**
   * 弹跳进入动画
   */
  private animateBounceIn(node: NodeData, delay: number): Promise<void> {
    const originalY = node.y!
    node.y = originalY - 50
    
    return this.animate(
      node,
      { y: originalY },
      { delay, easing: 'bounce' }
    )
  }
  
  /**
   * 级联动画（用于树形结构）
   */
  animateTree(root: NodeData, type: 'enter' | 'exit' = 'enter'): Promise<void> {
    const promises: Promise<void>[] = []
    let index = 0
    
    const traverse = (node: NodeData, level: number) => {
      const delay = index * this.config.stagger
      
      if (type === 'enter') {
        promises.push(this.animateNodeEnter(node, delay))
      } else {
        promises.push(this.animateNodeExit(node))
      }
      
      index++
      
      if (node.children && !node.collapsed) {
        node.children.forEach(child => traverse(child, level + 1))
      }
    }
    
    traverse(root, 0)
    
    return Promise.all(promises).then(() => {})
  }
  
  /**
   * 移动动画
   */
  animateMove(node: NodeData, toX: number, toY: number): Promise<void> {
    return this.animate(node, { x: toX, y: toY })
  }
  
  /**
   * 取消节点的所有动画
   */
  cancelNodeAnimations(nodeId: string): void {
    const toRemove: string[] = []
    
    this.animations.forEach((animation, id) => {
      if (animation.node.id === nodeId) {
        toRemove.push(id)
      }
    })
    
    toRemove.forEach(id => this.animations.delete(id))
  }
  
  /**
   * 取消所有动画
   */
  cancelAll(): void {
    this.animations.clear()
    this.stop()
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<AnimationConfig>): void {
    Object.assign(this.config, config)
  }
  
  /**
   * 获取配置
   */
  getConfig(): AnimationConfig {
    return { ...this.config }
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    this.cancelAll()
  }
}

