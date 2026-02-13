/**
 * 使用示例
 */

import { MindMapCore } from './index'
import type { NodeData } from './types'

// ============================================
// 示例 1: 基础使用
// ============================================

const basicExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: '项目规划',
      children: [
        {
          id: 'phase1',
          label: '第一阶段',
          children: [
            { id: 'task1', label: '需求分析', children: [] },
            { id: 'task2', label: '技术选型', children: [] }
          ]
        },
        {
          id: 'phase2',
          label: '第二阶段',
          children: [
            { id: 'task3', label: '开发实现', children: [] },
            { id: 'task4', label: '测试验证', children: [] }
          ]
        }
      ]
    },
    layout: {
      type: 'mindmap',
      nodeSpacing: 20,
      levelSpacing: 100
    },
    theme: 'default'
  })

  return mindmap
}

// ============================================
// 示例 2: 动态添加节点
// ============================================

const dynamicExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: '知识体系',
      children: []
    }
  })

  // 添加子节点
  mindmap.addNode('root', {
    label: '前端开发',
    children: []
  })

  mindmap.addNode('root', {
    label: '后端开发',
    children: []
  })

  // 监听节点点击，动态添加子节点
  mindmap.on('node:click', (e) => {
    if (e.target) {
      mindmap.addNode(e.target.id, {
        label: '新节点',
        children: []
      })
    }
  })

  return mindmap
}

// ============================================
// 示例 3: 自定义样式
// ============================================

const customStyleExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: '自定义样式',
      style: {
        backgroundColor: '#ff6b6b',
        color: '#fff',
        fontSize: 20,
        borderRadius: 10,
        padding: [15, 30]
      },
      children: [
        {
          id: 'node1',
          label: '圆形节点',
          style: {
            shape: 'circle',
            backgroundColor: '#4ecdc4',
            color: '#fff'
          },
          children: []
        },
        {
          id: 'node2',
          label: '菱形节点',
          style: {
            shape: 'diamond',
            backgroundColor: '#ffe66d',
            color: '#333'
          },
          children: []
        }
      ]
    }
  })

  return mindmap
}

// ============================================
// 示例 4: 自定义主题
// ============================================

const customThemeExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: '自定义主题',
      children: []
    }
  })

  // 注册自定义主题
  mindmap.registerTheme('ocean', {
    name: '海洋主题',
    global: {
      backgroundColor: '#e3f2fd',
      fontFamily: 'Arial, sans-serif'
    },
    nodeStyles: {
      root: {
        backgroundColor: '#0277bd',
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        borderRadius: 12,
        padding: [15, 30]
      },
      level1: {
        backgroundColor: '#0288d1',
        color: '#fff',
        fontSize: 16,
        borderRadius: 8,
        padding: [12, 24]
      },
      level2: {
        backgroundColor: '#039be5',
        color: '#fff',
        fontSize: 14,
        borderRadius: 6,
        padding: [10, 20]
      },
      default: {
        backgroundColor: '#fff',
        color: '#01579b',
        fontSize: 14,
        borderColor: '#0288d1',
        borderWidth: 2,
        borderRadius: 4,
        padding: [8, 16]
      }
    },
    edgeStyle: {
      color: '#0288d1',
      width: 2,
      curve: 'bezier'
    },
    colorScheme: ['#0277bd', '#0288d1', '#039be5', '#03a9f4', '#29b6f6', '#4fc3f7']
  })

  // 应用主题
  mindmap.setTheme('ocean')

  return mindmap
}

// ============================================
// 示例 5: 不同布局类型
// ============================================

const layoutExample = () => {
  const data: NodeData = {
    id: 'root',
    label: '中心节点',
    children: [
      {
        id: 'n1',
        label: '节点 1',
        children: [
          { id: 'n1-1', label: '节点 1-1', children: [] },
          { id: 'n1-2', label: '节点 1-2', children: [] }
        ]
      },
      {
        id: 'n2',
        label: '节点 2',
        children: [
          { id: 'n2-1', label: '节点 2-1', children: [] },
          { id: 'n2-2', label: '节点 2-2', children: [] }
        ]
      }
    ]
  }

  // 思维导图布局
  const mindmap1 = new MindMapCore({
    container: '#container1',
    data,
    layout: { type: 'mindmap' }
  })

  // 树形布局（向右）
  const mindmap2 = new MindMapCore({
    container: '#container2',
    data,
    layout: { type: 'tree-right' }
  })

  // 放射状布局
  const mindmap3 = new MindMapCore({
    container: '#container3',
    data,
    layout: { type: 'radial' }
  })

  // 鱼骨图布局
  const mindmap4 = new MindMapCore({
    container: '#container4',
    data,
    layout: { type: 'fishbone' }
  })

  return { mindmap1, mindmap2, mindmap3, mindmap4 }
}

// ============================================
// 示例 6: 事件处理
// ============================================

const eventExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: '事件示例',
      children: []
    }
  })

  // 节点点击
  mindmap.on('node:click', (e) => {
    console.log('节点被点击:', e.target?.label)
  })

  // 节点双击
  mindmap.on('node:dblclick', (e) => {
    console.log('节点被双击:', e.target?.label)
    // 进入编辑模式
    if (e.target) {
      e.target.editing = true
    }
  })

  // 节点右键菜单
  mindmap.on('node:contextmenu', (e) => {
    console.log('节点右键菜单:', e.target?.label)
    // 显示自定义菜单
  })

  // 节点拖拽
  mindmap.on('node:dragstart', (e) => {
    console.log('开始拖拽:', e.target?.label)
  })

  mindmap.on('node:drag', (e) => {
    console.log('拖拽中:', e.target?.label)
  })

  mindmap.on('node:dragend', (e) => {
    console.log('拖拽结束:', e.target?.label)
  })

  // 画布缩放
  mindmap.on('canvas:zoom', (e) => {
    console.log('缩放比例:', e.data?.scale)
  })

  // 选择变化
  mindmap.on('selection:change', (e) => {
    console.log('选中的节点:', e.data?.selected)
  })

  return mindmap
}

// ============================================
// 示例 7: 导出功能
// ============================================

const exportExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: '导出示例',
      children: []
    }
  })

  // 导出为 PNG
  const exportPNG = () => {
    mindmap.export({
      format: 'png',
      quality: 1,
      backgroundColor: '#fff'
    })
  }

  // 导出为 JSON
  const exportJSON = () => {
    mindmap.export({
      format: 'json'
    })
  }

  // 导出为 Markdown
  const exportMarkdown = () => {
    mindmap.export({
      format: 'markdown'
    })
  }

  return { mindmap, exportPNG, exportJSON, exportMarkdown }
}

// ============================================
// 示例 8: AI 集成示例
// ============================================

const aiIntegrationExample = () => {
  const mindmap = new MindMapCore({
    container: '#mindmap-container',
    data: {
      id: 'root',
      label: 'AI 生成的思维导图',
      children: []
    }
  })

  // 模拟 AI 生成节点
  const generateFromAI = async (topic: string) => {
    // 调用 AI API 生成结构
    const aiResponse = {
      topic: topic,
      children: [
        {
          label: 'AI 生成的子主题 1',
          children: [
            { label: '详细内容 1-1' },
            { label: '详细内容 1-2' }
          ]
        },
        {
          label: 'AI 生成的子主题 2',
          children: [
            { label: '详细内容 2-1' },
            { label: '详细内容 2-2' }
          ]
        }
      ]
    }

    // 转换为节点数据
    const convertToNodeData = (data: any, parentId = 'root'): NodeData => {
      return {
        id: `node_${Date.now()}_${Math.random()}`,
        label: data.label || data.topic,
        children: data.children?.map((child: any) => convertToNodeData(child)) || []
      }
    }

    const newData = convertToNodeData(aiResponse)
    mindmap.setData(newData)
    
    // 适应视图
    mindmap.fitView()
  }

  return { mindmap, generateFromAI }
}

// ============================================
// 示例 9: Vue3 组合式 API 使用
// ============================================

/*
// 在 Vue3 组件中使用
import { ref, onMounted, onUnmounted } from 'vue'
import { MindMapCore } from '@/mindmap-core'

export default {
  setup() {
    const containerRef = ref<HTMLElement>()
    let mindmap: MindMapCore | null = null

    const data = ref({
      id: 'root',
      label: 'Vue3 示例',
      children: []
    })

    onMounted(() => {
      if (containerRef.value) {
        mindmap = new MindMapCore({
          container: containerRef.value,
          data: data.value
        })

        // 监听事件
        mindmap.on('node:click', (e) => {
          console.log('节点被点击:', e.target)
        })
      }
    })

    onUnmounted(() => {
      mindmap?.destroy()
    })

    const addNode = (parentId: string, label: string) => {
      mindmap?.addNode(parentId, { label, children: [] })
    }

    const removeNode = (nodeId: string) => {
      mindmap?.removeNode(nodeId)
    }

    const exportData = () => {
      const exportedData = mindmap?.getData()
      console.log('导出的数据:', exportedData)
    }

    return {
      containerRef,
      addNode,
      removeNode,
      exportData
    }
  }
}
*/

// ============================================
// 导出所有示例
// ============================================

export {
  basicExample,
  dynamicExample,
  customStyleExample,
  customThemeExample,
  layoutExample,
  eventExample,
  exportExample,
  aiIntegrationExample
}

