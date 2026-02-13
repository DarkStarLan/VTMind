<template>
  <div class="mind-map-container">
    <!-- 悬浮控制面板 -->
    <div class="floating-controls" :class="{ collapsed: !controlsExpanded }">
      <button class="toggle-btn" @click="controlsExpanded = !controlsExpanded" :title="controlsExpanded ? '收起' : '展开'">
        <span class="toggle-icon">{{ controlsExpanded ? '◀' : '▶' }}</span>
      </button>
      
      <div class="controls-content" v-show="controlsExpanded">
        <div class="control-section">
          <label class="control-label">布局</label>
          <select v-model="selectedLayout" @change="handleLayoutChange" class="control-select">
            <option value="mindmap">树形（两侧）</option>
            <option value="tree-right">树形（右）</option>
            <option value="tree-left">树形（左）</option>
            <option value="tree-down">树形（下）</option>
            <option value="radial">放射状</option>
          </select>
        </div>
        
        <div class="control-section">
          <label class="control-label">主题</label>
          <select v-model="selectedTheme" @change="handleThemeChange" class="control-select">
            <option value="default">默认</option>
            <option value="dark">暗黑</option>
            <option value="colorful">多彩</option>
            <option value="minimal">简约</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 思维导图容器 -->
    <div ref="containerRef" class="mindmap-canvas"></div>

    <!-- 节点右键菜单 -->
    <div 
      v-if="contextMenu.visible && contextMenu.nodeId" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="menu-item" @click="addChildNode">
        <span class="menu-icon">+</span>
        添加子节点
      </div>
      <div class="menu-item" @click="addSiblingNode">
        <span class="menu-icon">+</span>
        添加同级节点
      </div>
      <div class="menu-item" @click="editNode">
        <span class="menu-icon">✎</span>
        编辑节点
      </div>
      <div class="menu-item" @click="deleteNode">
        <span class="menu-icon">×</span>
        删除节点
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="changeNodeStyle">
        <span class="menu-icon">◆</span>
        更改样式
      </div>
    </div>

    <!-- 画布右键菜单 -->
    <div 
      v-if="contextMenu.visible && !contextMenu.nodeId" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="menu-item" @click="addRootChildNode">
        <span class="menu-icon">+</span>
        新建节点
      </div>
    </div>

    <!-- 样式选择菜单 -->
    <div 
      v-if="styleMenu.visible" 
      class="style-menu"
      :style="{ left: styleMenu.x + 'px', top: styleMenu.y + 'px' }"
    >
      <div class="style-menu-header">选择节点样式</div>
      <div class="style-options">
        <div 
          class="style-option"
          v-for="(style, index) in nodeStyles"
          :key="index"
          @click="applyStyle(style)"
        >
          <div class="style-preview" :style="{ background: style.bg, borderColor: style.fg }"></div>
          <span class="style-name">{{ style.name }}</span>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editDialog.visible" class="edit-dialog-overlay" @click="closeEditDialog">
      <div class="edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑节点</h3>
          <button class="close-btn" @click="closeEditDialog">×</button>
        </div>
        <div class="dialog-body">
          <textarea 
            v-model="editDialog.text" 
            placeholder="输入节点内容..."
            rows="3"
            ref="editTextarea"
            @keydown.enter.ctrl="saveEdit"
          ></textarea>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeEditDialog">取消</button>
          <button class="btn-save" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 自定义对话框 -->
    <Dialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { MindMapCore } from '@/mindmap-core'
import type { NodeData, NodeStyle } from '@/mindmap-core'
import type { MindNode } from '@/types'
import Dialog from './Dialog.vue'

const props = defineProps<{
  data: MindNode
  structure?: 'tree' | 'radial' | 'fishbone' | 'network' | 'timeline'
  layoutOption?: string
  graphData?: any
}>()

const emit = defineEmits<{
  nodeClick: [node: MindNode]
  nodeUpdate: [data: MindNode]
  structureChange: [structure: string, layoutOption: string]
  graphDataUpdate: [graphData: any]
}>()

const containerRef = ref<HTMLDivElement>()
const editTextarea = ref<HTMLTextAreaElement>()
const dialogRef = ref<InstanceType<typeof Dialog>>()
let mindmap: MindMapCore | null = null

// 布局和主题选择
const selectedLayout = ref(props.layoutOption || 'mindmap')
// 根据当前系统主题初始化
const selectedTheme = ref(
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default'
)

// 监听 layoutOption prop 的变化
watch(() => props.layoutOption, (newLayout) => {
  if (newLayout && newLayout !== selectedLayout.value) {
    selectedLayout.value = newLayout
    if (mindmap) {
      mindmap.setLayout({ 
        type: newLayout as any,
        preservePosition: false 
      })
    }
  }
})

// 节点样式选项
const nodeStyles = [
  { name: '默认蓝', bg: '#5B8FF9', fg: '#fff' },
  { name: '活力红', bg: '#F4664A', fg: '#fff' },
  { name: '清新绿', bg: '#5AD8A6', fg: '#fff' },
  { name: '明亮黄', bg: '#F6BD16', fg: '#333' },
  { name: '优雅紫', bg: '#9270CA', fg: '#fff' },
  { name: '温暖橙', bg: '#FF9845', fg: '#fff' }
]

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  nodeId: ''
})

// 编辑对话框状态
const editDialog = ref({
  visible: false,
  text: '',
  nodeId: ''
})

// 样式选择菜单状态
const styleMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  nodeId: ''
})

// 控制面板展开状态
const controlsExpanded = ref(true)

onMounted(() => {
  nextTick(() => {
    initMindMap()
    setupThemeObserver()
  })
})

onUnmounted(() => {
  if (mindmap) {
    mindmap.destroy()
    mindmap = null
  }
  document.removeEventListener('click', handleDocumentClick)
  
  // 清理主题观察器
  if (themeObserver) {
    themeObserver.disconnect()
  }
})

// 主题观察器
let themeObserver: MutationObserver | null = null

// 设置主题观察器
function setupThemeObserver() {
  themeObserver = new MutationObserver(() => {
    updateCanvasBackground()
    
    // 当系统主题切换时，自动切换思维导图主题
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const newTheme = isDark ? 'dark' : 'default'
    
    // 如果主题发生变化，更新选择器和思维导图主题
    if (selectedTheme.value !== newTheme) {
      selectedTheme.value = newTheme
      if (mindmap) {
        mindmap.setTheme(newTheme)
        mindmap.forceRender()
      }
    }
    
    // 如果当前是简约主题，需要重新渲染以应用新的颜色
    if (selectedTheme.value === 'minimal' && mindmap) {
      mindmap.setTheme(selectedTheme.value)
      mindmap.forceRender()
    }
  })
  
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
  
  // 初始设置背景
  updateCanvasBackground()
}

// 更新画布背景颜色
function updateCanvasBackground() {
  if (!containerRef.value || !mindmap) return
  
  // 获取当前主题的背景颜色
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-canvas').trim()
  
  // 设置 RenderEngine 的背景颜色
  const renderEngine = mindmap.getRenderEngine()
  if (renderEngine) {
    renderEngine.setBackgroundColor(bgColor)
    mindmap.forceRender()
  }
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (mindmap && newData) {
    const mindmapData = convertToMindMapData(newData)
    // 数据更新时不自动居中，保持当前视角
    mindmap.setData(mindmapData, false)
  }
}, { deep: true })

// 初始化思维导图
function initMindMap() {
  if (!containerRef.value) {
    console.error('Container not found')
    return
  }

  try {
    // 转换数据格式
    const mindmapData = convertToMindMapData(props.data)
    
    // 检查是否有保存的位置信息
    const hasPositions = checkHasPositions(props.data)
    
    // 创建思维导图实例
    mindmap = new MindMapCore({
    container: containerRef.value,
      data: mindmapData,
      layout: {
        type: selectedLayout.value as any,
        nodeSpacing: 30,
        levelSpacing: 240,
        preservePosition: hasPositions  // 如果有位置信息则保留
      },
      theme: selectedTheme.value,
      animation: {
        enabled: true,
        duration: 300,
        easing: 'ease-out'
      },
      interaction: {
        draggable: true,
        dragNode: true,
        dragCanvas: true,
        zoomable: true,
        minZoom: 0.3,
        maxZoom: 3,
        selectable: true,
        editable: true,
        collapsible: true
      },
      render: {
        renderer: 'canvas',
        antialias: true,
        pixelRatio: window.devicePixelRatio || 2
      }
    })

    // 绑定事件
    setupEvents()
    
    // 设置初始背景颜色
    setTimeout(() => {
      updateCanvasBackground()
    }, 100)
    
    console.log('MindMap initialized successfully')
  } catch (error) {
    console.error('Failed to initialize MindMap:', error)
  }
}

// 检查节点是否有位置信息
function checkHasPositions(node: MindNode): boolean {
  if (node.x === undefined || node.y === undefined) {
    return false
  }
  
  if (node.children && !node.collapsed) {
    for (const child of node.children) {
      if (!checkHasPositions(child)) {
        return false
      }
    }
  }
  
  return true
}

// 设置事件监听
function setupEvents() {
  if (!mindmap) return

  // 节点点击
  mindmap.on('node:click', (e) => {
    if (e.target) {
      contextMenu.value.nodeId = e.target.id
      emit('nodeClick', convertFromMindMapData(e.target))
    }
  })

  // 节点折叠/展开
  mindmap.on('node:collapse', () => {
    syncDataToParent()
  })

  mindmap.on('node:expand', () => {
    syncDataToParent()
  })

  // 节点拖拽结束
  mindmap.on('node:dragend', () => {
    syncDataToParent()
  })

  // 节点双击（编辑）
  mindmap.on('node:dblclick', (e) => {
    if (e.target) {
      openEditDialog(e.target.id, e.target.label)
    }
  })

  // 节点右键菜单
  mindmap.on('node:contextmenu', (e) => {
    if (e.target && e.originalEvent) {
      e.originalEvent.preventDefault()
      contextMenu.value = {
        visible: true,
        x: (e.originalEvent as MouseEvent).clientX,
        y: (e.originalEvent as MouseEvent).clientY,
        nodeId: e.target.id
      }
    }
  })

  // 画布右键菜单
  mindmap.on('canvas:contextmenu', (e) => {
    if (e.originalEvent) {
      e.originalEvent.preventDefault()
      contextMenu.value = {
        visible: true,
        x: (e.originalEvent as MouseEvent).clientX,
        y: (e.originalEvent as MouseEvent).clientY,
        nodeId: ''
      }
    }
  })

  // 监听点击关闭菜单
  document.addEventListener('click', handleDocumentClick)
}

// 处理文档点击
function handleDocumentClick() {
  contextMenu.value.visible = false
  styleMenu.value.visible = false
}

// 转换数据为思维导图格式
function convertToMindMapData(node: MindNode): NodeData {
  const result: NodeData = {
    id: node.id,
    label: node.label,
    children: node.children?.map(child => convertToMindMapData(child)) || [],
    // 保留位置信息
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    // 保留折叠状态
    collapsed: node.collapsed
  }

  if (node.style) {
    result.style = {
      backgroundColor: node.style.fill,
      color: node.style.stroke || '#fff'
    }
  }

  return result
}

// 从思维导图数据转换
function convertFromMindMapData(node: NodeData): MindNode {
  const result: MindNode = {
    id: node.id,
    label: node.label,
    children: node.children?.map(child => convertFromMindMapData(child)),
    // 保存位置信息
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    // 保存折叠状态
    collapsed: node.collapsed
  }

  if (node.style) {
    result.style = {
      fill: node.style.backgroundColor,
      stroke: node.style.color
    }
  }

  return result
}

// 布局变化
function handleLayoutChange() {
  if (mindmap) {
    // 切换布局时不保留位置，重新计算
    mindmap.setLayout({ 
      type: selectedLayout.value as any,
      preservePosition: false 
    })
  }
}

// 主题变化
function handleThemeChange() {
  if (mindmap) {
    mindmap.setTheme(selectedTheme.value)
  }
}

// 打开编辑对话框
function openEditDialog(nodeId: string, currentText: string) {
  editDialog.value = {
    visible: true,
    text: currentText,
    nodeId
  }
  contextMenu.value.visible = false
  nextTick(() => {
    editTextarea.value?.focus()
    editTextarea.value?.select()
  })
}

// 关闭编辑对话框
function closeEditDialog() {
  editDialog.value.visible = false
}

// 保存编辑
function saveEdit() {
  if (editDialog.value.text.trim() && mindmap) {
    mindmap.updateNode(editDialog.value.nodeId, { label: editDialog.value.text.trim() })
    syncDataToParent()
  }
  closeEditDialog()
}

// 添加子节点
function addChildNode() {
  if (!mindmap) return
  
  const nodeId = contextMenu.value.nodeId
  mindmap.addNode(nodeId, {
    label: '新节点',
    children: []
  })
  
  syncDataToParent()
  contextMenu.value.visible = false
}

// 添加同级节点
async function addSiblingNode() {
  if (!mindmap) return
  
  const nodeId = contextMenu.value.nodeId
  const node = mindmap.findNode((n) => n.id === nodeId)
  
  if (!node) return
  
  // 查找父节点
  const rootData = mindmap.getData()
  if (!rootData) return
  
  let parentNode: NodeData | null = null
  
  function findParent(current: NodeData, targetId: string): NodeData | null {
    if (current.children) {
      for (const child of current.children) {
        if (child.id === targetId) {
          return current
        }
        const found = findParent(child, targetId)
        if (found) return found
      }
    }
    return null
  }
  
  parentNode = findParent(rootData, nodeId)
  
  if (!parentNode) {
    await dialogRef.value?.alert('根节点不能添加同级节点')
    contextMenu.value.visible = false
    return
  }
  
  mindmap.addNode(parentNode.id, {
    label: '新节点',
    children: []
  })
  
  syncDataToParent()
  contextMenu.value.visible = false
}

// 在根节点添加子节点
function addRootChildNode() {
  if (!mindmap) return
  
  const rootData = mindmap.getData()
  if (!rootData) return
  
  mindmap.addNode(rootData.id, {
    label: '新节点',
    children: []
  })
  
  syncDataToParent()
  contextMenu.value.visible = false
}

// 编辑节点
function editNode() {
  const nodeId = contextMenu.value.nodeId
  const node = mindmap?.findNode((n) => n.id === nodeId)
  
  if (node) {
    openEditDialog(nodeId, node.label)
  }
}

// 删除节点
async function deleteNode() {
  const nodeId = contextMenu.value.nodeId
  const rootData = mindmap?.getData()
  
  if (!rootData || nodeId === rootData.id) {
    await dialogRef.value?.alert('不能删除根节点')
    contextMenu.value.visible = false
    return
  }
  
  const confirmed = await dialogRef.value?.confirm('确定删除此节点及其所有子节点？')
  if (!confirmed) {
    contextMenu.value.visible = false
    return
  }
  
  if (mindmap) {
    mindmap.removeNode(nodeId)
    syncDataToParent()
  }
  
  contextMenu.value.visible = false
}

// 更改节点样式
function changeNodeStyle() {
  styleMenu.value = {
    visible: true,
    x: contextMenu.value.x,
    y: contextMenu.value.y,
    nodeId: contextMenu.value.nodeId
  }
  contextMenu.value.visible = false
}

// 应用样式
function applyStyle(style: { bg: string; fg: string }) {
  const nodeId = styleMenu.value.nodeId
  if (mindmap) {
    mindmap.updateNode(nodeId, {
      style: {
        backgroundColor: style.bg,
        color: style.fg
      }
    })
    syncDataToParent()
  }
  styleMenu.value.visible = false
}

// 同步数据到父组件
function syncDataToParent() {
  const data = mindmap?.getData()
  if (data) {
    const mindNodeData = convertFromMindMapData(data)
    emit('nodeUpdate', mindNodeData)
  }
}

// 导出图片
function exportImage() {
  mindmap?.export({ format: 'png', quality: 1 })
}

// 适应画布
function fitView() {
  mindmap?.fitView()
}

// 格式化布局（重新计算位置）
function formatLayout() {
  if (mindmap) {
    // 临时设置为不保留位置，执行一次布局
    mindmap.setLayout({ 
      type: selectedLayout.value as any,
      preservePosition: false 
    })
    
    // 格式化完成后，恢复为保留位置模式
    // 使用 nextTick 确保布局计算完成后再恢复
    nextTick(() => {
      if (mindmap) {
        mindmap.setLayout({ 
          type: selectedLayout.value as any,
          preservePosition: true 
        })
      }
    })
    
    // 同步数据到父组件
    syncDataToParent()
  }
}

// 放大
function zoomIn() {
  mindmap?.zoom(1.2)
}

// 缩小
function zoomOut() {
  mindmap?.zoom(0.8)
}

defineExpose({
  exportImage,
  fitView,
  formatLayout,
  zoomIn,
  zoomOut
})
</script>

<style scoped>
.mind-map-container {
  width: 100%;
  height: 100%;
  background: var(--bg-canvas);
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 0.3s ease;
  position: relative;
}

.mindmap-canvas {
  width: 100%;
  height: 100%;
  background: var(--bg-canvas);
  transition: background-color 0.3s ease;
}

/* 悬浮控制面板 */
.floating-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 10;
  backdrop-filter: blur(10px);
  background: rgba(var(--bg-primary-rgb), 0.95);
  transition: all 0.3s ease;
}

.floating-controls.collapsed {
  width: 48px;
  height: 48px;
  padding: 0;
}

.floating-controls:not(.collapsed) {
  padding: 16px;
  padding-top: 48px;
  min-width: 220px;
}

.toggle-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;
}

.floating-controls.collapsed .toggle-btn {
  position: static;
  margin: 10px;
}

.toggle-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-primary);
}

.toggle-icon {
  font-size: 12px;
  color: var(--text-primary);
  transition: transform 0.3s ease;
}

.controls-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.control-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  width: 100%;
}

.control-select:hover {
  border-color: var(--accent-primary);
}

.control-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(254, 127, 45, 0.1);
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
  min-width: 180px;
  z-index: 1000;
  animation: menuFadeIn 0.15s ease;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-icon {
  font-size: 16px;
  width: 20px;
  display: inline-block;
  text-align: center;
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 0;
}

/* 编辑对话框样式 */
.edit-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: overlayFadeIn 0.2s ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.edit-dialog {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  animation: dialogSlideIn 0.3s ease;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.dialog-header .close-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 6px;
  font-size: 18px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-header .close-btn:hover {
  background: var(--bg-hover);
}

.dialog-body {
  padding: 24px;
}

.dialog-body textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  min-height: 80px;
}

.dialog-body textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(254, 127, 45, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.dialog-footer button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-save {
  background: var(--accent-primary);
  color: white;
}

.btn-save:hover {
  background: #ff8f3d;
}

/* 样式选择菜单 */
.style-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  padding: 8px;
  min-width: 200px;
  z-index: 1000;
  animation: menuFadeIn 0.15s ease;
}

.style-menu-header {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.style-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.style-option:hover {
  background: var(--bg-hover);
}

.style-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.style-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
</style>
