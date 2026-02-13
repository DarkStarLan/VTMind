<template>
  <div class="app">
    <Toolbar 
      :dialog-ref="dialogRef"
      @undo="handleUndo"
      @redo="handleRedo"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @fit-view="handleFitView"
      @format="handleFormat"
      @export="handleExport"
      @import="handleImport"
      @open-settings="showSettings = true"
      @create-new="handleCreateNew"
      @open-a-i-chat="showAIChat = !showAIChat"
    />

    <div class="main-content">
      <div class="canvas-area">
        <div v-if="!currentMap" class="welcome">
          <div class="welcome-content">
            <h1>欢迎使用 VTMind</h1>
            <p>AI 驱动的思维导图工具</p>
            <div class="welcome-actions">
              <button class="welcome-btn primary" @click="showSettings = true">
                配置 API Key
              </button>
              <button class="welcome-btn" @click="createDemo">
                查看示例
              </button>
            </div>
          </div>
        </div>

        <MindMap 
          v-else
          :key="currentMap.id"
          ref="mindMapRef"
          :data="currentMap.root"
          :structure="currentMap.structure"
          :layout-option="currentMap.layoutOption"
          :graph-data="currentMap.graphData"
          @node-click="handleNodeClick"
          @node-update="handleNodeUpdate"
          @structure-change="handleStructureChange"
          @graph-data-update="handleGraphDataUpdate"
        />
      </div>

      <!-- AI 面板作为浮动层 -->
      <transition name="slide-left">
        <AIChatPanel 
          v-if="showAIChat"
          class="floating-panel"
          :dialog-ref="dialogRef"
          @close="showAIChat = false"
          @generated="handleGenerated"
          @updated="handleOptimized"
        />
      </transition>

      <AIPanel 
        v-if="!showAIChat"
        class="floating-panel"
        :selected-node="selectedNode"
        @open-settings="showSettings = true"
        @generated="handleGenerated"
        @expanded="handleExpanded"
        @optimized="handleOptimized"
      />
    </div>

    <SettingsPanel 
      :show="showSettings"
      @close="showSettings = false"
    />

    <input 
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />

    <!-- 全局对话框 -->
    <Dialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMindMapStore } from '@/stores/mindMapStore'
import { useSettingsStore } from '@/stores/settingsStore'
import Toolbar from '@/components/Toolbar.vue'
import MindMap from '@/components/MindMap.vue'
import AIPanel from '@/components/AIPanel.vue'
import AIChatPanel from '@/components/AIChatPanel.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import Dialog from '@/components/Dialog.vue'
import type { MindNode } from '@/types'

const mindMapStore = useMindMapStore()
const settingsStore = useSettingsStore()

const mindMapRef = ref<InstanceType<typeof MindMap>>()
const fileInputRef = ref<HTMLInputElement>()
const dialogRef = ref<InstanceType<typeof Dialog>>()
const showSettings = ref(false)
const showAIChat = ref(false)
const selectedNode = ref<MindNode>()

const currentMap = computed(() => mindMapStore.currentMap)

onMounted(() => {
  mindMapStore.init()
  settingsStore.init()

  // 键盘快捷键
  window.addEventListener('keydown', handleKeyboard)
})

function handleKeyboard(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleUndo()
    } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
      e.preventDefault()
      handleRedo()
    } else if (e.key === 's') {
      e.preventDefault()
      handleExport('json')
    }
  }
}

function handleNodeClick(node: MindNode) {
  selectedNode.value = node
}

function handleNodeUpdate(data: MindNode) {
  mindMapStore.updateMap(data)
}

function handleStructureChange(structure: string, layoutOption: string) {
  if (currentMap.value) {
    currentMap.value.structure = structure as any
    currentMap.value.layoutOption = layoutOption
    currentMap.value.updatedAt = Date.now()
    // 清除旧的图数据，因为结构变了需要重新计算
    currentMap.value.graphData = undefined
    mindMapStore.saveToStorage()
  }
}

function handleGraphDataUpdate(graphData: any) {
  if (currentMap.value) {
    currentMap.value.graphData = graphData
    currentMap.value.updatedAt = Date.now()
    mindMapStore.saveToStorage()
  }
}

function handleGenerated(data: MindNode, structure: string, layoutOption: string) {
  const name = data.label || '新思维导图'
  mindMapStore.createMap(name, data, structure as any, layoutOption)
  selectedNode.value = undefined
}

function handleExpanded(expandedNode: MindNode) {
  if (!currentMap.value) return

  const updateNode = (node: MindNode): MindNode => {
    if (node.id === expandedNode.id) {
      return expandedNode
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updateNode(child))
      }
    }
    return node
  }

  const updatedRoot = updateNode(currentMap.value.root)
  mindMapStore.updateMap(updatedRoot)
}

function handleOptimized(optimizedRoot: MindNode) {
  mindMapStore.updateMap(optimizedRoot)
}

function handleUndo() {
  mindMapStore.undo()
}

function handleRedo() {
  mindMapStore.redo()
}

function handleZoomIn() {
  mindMapRef.value?.zoomIn()
}

function handleZoomOut() {
  mindMapRef.value?.zoomOut()
}

function handleFitView() {
  mindMapRef.value?.fitView()
}

function handleFormat() {
  mindMapRef.value?.formatLayout()
}

function handleExport(type: 'json' | 'png') {
  if (!currentMap.value) return

  if (type === 'json') {
    // 导出完整的思维导图数据，包括位置和折叠状态
    const exportData = {
      name: currentMap.value.name,
      root: currentMap.value.root,
      structure: currentMap.value.structure,
      layoutOption: currentMap.value.layoutOption,
      createdAt: currentMap.value.createdAt,
      updatedAt: currentMap.value.updatedAt
    }
    const data = JSON.stringify(exportData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentMap.value.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  } else if (type === 'png') {
    mindMapRef.value?.exportImage()
  }
}

function handleImport() {
  fileInputRef.value?.click()
}

async function handleFileImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.root && data.name) {
        // 导入完整的思维导图数据，包括位置、折叠状态和布局信息
        mindMapStore.createMap(
          data.name, 
          data.root, 
          data.structure || 'tree', 
          data.layoutOption || 'tree-right'
        )
      } else if (data.label) {
        // 直接是节点数据
        mindMapStore.createMap(data.label, data)
      } else {
        await dialogRef.value?.alert('无效的文件格式')
      }
    } catch (error) {
      await dialogRef.value?.alert('文件解析失败')
    }
  }
  reader.readAsText(file)
  target.value = ''
}

async function handleCreateNew() {
  const name = await dialogRef.value?.prompt('请输入思维导图名称:', '新思维导图', '新建思维导图')
  if (!name) return

  const newData: MindNode = {
    id: `node_${Date.now()}`,
    label: name,
    children: [
      {
        id: `node_${Date.now()}_1`,
        label: '分支 1',
        children: []
      },
      {
        id: `node_${Date.now()}_2`,
        label: '分支 2',
        children: []
      },
      {
        id: `node_${Date.now()}_3`,
        label: '分支 3',
        children: []
      }
    ]
  }

  mindMapStore.createMap(name, newData, 'tree', 'tree-right')
}

function createDemo() {
  const demoData: MindNode = {
    id: 'demo_root',
    label: 'Vue 3 学习路线',
    children: [
      {
        id: 'demo_1',
        label: '基础知识',
        children: [
          { id: 'demo_1_1', label: '响应式原理' },
          { id: 'demo_1_2', label: 'Composition API' },
          { id: 'demo_1_3', label: '生命周期' }
        ]
      },
      {
        id: 'demo_2',
        label: '进阶内容',
        children: [
          { id: 'demo_2_1', label: '状态管理 Pinia' },
          { id: 'demo_2_2', label: '路由 Vue Router' },
          { id: 'demo_2_3', label: '性能优化' }
        ]
      },
      {
        id: 'demo_3',
        label: '工程化',
        children: [
          { id: 'demo_3_1', label: 'Vite 构建工具' },
          { id: 'demo_3_2', label: 'TypeScript' },
          { id: 'demo_3_3', label: '测试' }
        ]
      }
    ]
  }

  mindMapStore.createMap('Vue 3 学习路线', demoData, 'tree', 'tree-right')
}
</script>

<style>
@import './theme.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-canvas);
  color: var(--text-primary);
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-canvas);
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-area {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.floating-panel {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  z-index: 100;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
}

/* 滑动动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

.welcome {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-welcome);
}

.welcome-content {
  text-align: center;
  color: var(--text-primary);
}

.welcome-content h1 {
  font-size: 48px;
  margin-bottom: 16px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: #F5FBE6;
}

.welcome-content p {
  font-size: 20px;
  margin-bottom: 32px;
  opacity: 0.9;
  color: #F5FBE6;
}

.welcome-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.welcome-btn {
  padding: 14px 32px;
  background: rgba(245, 251, 230, 0.2);
  color: #F5FBE6;
  border: 2px solid #F5FBE6;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.welcome-btn:hover {
  background: rgba(245, 251, 230, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.welcome-btn.primary {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.welcome-btn.primary:hover {
  background: #ff8f3d;
  border-color: #ff8f3d;
}
</style>

