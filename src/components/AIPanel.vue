<template>
  <div class="ai-panel" :class="{ collapsed: isCollapsed }">
    <!-- 收起/展开按钮 -->
    <button class="toggle-panel-btn" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? '展开面板' : '收起面板'">
      {{ isCollapsed ? '◀' : '▶' }}
    </button>
    
    <div v-show="!isCollapsed" class="panel-content">
      <div class="panel-header">
        <h3>AI 助手</h3>
        <button 
          v-if="!hasConfig" 
          class="config-btn"
          @click="emit('openSettings')"
        >
          配置 API
        </button>
      </div>

      <div class="panel-body">
        <div v-if="!hasConfig" class="no-config">
          <p>请先配置 AI API Key</p>
          <button class="primary-btn" @click="emit('openSettings')">
            去配置
          </button>
        </div>

        <div v-else class="ai-controls">
          <div class="input-group">
            <label>生成主题</label>
            <input 
              v-model="topic"
              type="text"
              placeholder="例如：Vue 3 学习路线"
              @keyup.enter="generate"
            />
          </div>

          <div class="input-group">
            <div class="section-header" @click="showStructures = !showStructures">
              <label>结构类型</label>
              <span class="toggle-icon">{{ showStructures ? '▼' : '▶' }}</span>
            </div>
            <div v-show="showStructures" class="structure-grid">
              <div 
                v-for="struct in structures"
                :key="struct.id"
                class="structure-card"
                :class="{ active: structure === struct.id }"
                @click="structure = struct.id"
              >
                <div class="structure-icon">{{ struct.icon }}</div>
                <div class="structure-name">{{ struct.name }}</div>
              </div>
            </div>
          </div>

          <div class="input-group" v-if="currentLayouts.length > 0">
            <label>
              布局选项
              <span class="label-tip">{{ currentLayouts.find(l => l.id === layoutOption)?.name || '请选择' }}</span>
            </label>
            <select v-model="layoutOption" class="layout-select">
              <option 
                v-for="layout in currentLayouts"
                :key="layout.id"
                :value="layout.id"
              >
                {{ layout.name }}{{ layout.recommended ? ' (推荐)' : '' }}
              </option>
            </select>
          </div>

          <div class="input-group">
            <label>
              自定义提示词
              <span class="label-tip">可选</span>
            </label>
            <textarea 
              v-model="customPrompt"
              placeholder="例如：重点关注实战应用和代码示例..."
              rows="2"
            ></textarea>
          </div>

          <div class="advanced-options">
            <div class="options-header" @click="showAdvanced = !showAdvanced">
              <span>高级选项</span>
              <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
            </div>
            <div v-show="showAdvanced" class="options-content">
              <div class="options-row">
                <div class="option-group">
                  <label>深度层级</label>
                  <select v-model.number="depth">
                    <option :value="2">2层</option>
                    <option :value="3">3层</option>
                    <option :value="4">4层</option>
                    <option :value="5">5层</option>
                  </select>
                </div>

                <div class="option-group">
                  <label>分支数量</label>
                  <select v-model.number="branches">
                    <option :value="3">3个</option>
                    <option :value="5">5个</option>
                    <option :value="7">7个</option>
                    <option :value="9">9个</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="generate-actions">
            <button 
              class="generate-btn"
              @click="generate"
              :disabled="loading || !topic"
            >
              {{ loading ? '生成中...' : '生成' }}
            </button>
          </div>

          <div v-if="selectedNode" class="node-actions">
            <h4>节点操作</h4>
            <p class="selected-node">{{ selectedNode.label }}</p>
            <button 
              class="action-btn"
              @click="expandNode"
              :disabled="loading"
            >
              扩展此节点
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="loading || isRecommending" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-message">{{ progressMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMindMapStore } from '@/stores/mindMapStore'
import { AIService } from '@/services/aiService'
import { MIND_MAP_STRUCTURES } from '@/utils/constants'
import type { MindNode } from '@/types'

const emit = defineEmits<{
  openSettings: []
  generated: [data: MindNode, structure: string, layoutOption: string]
  expanded: [data: MindNode]
  optimized: [data: MindNode]
}>()

const props = defineProps<{
  selectedNode?: MindNode
}>()

const settingsStore = useSettingsStore()
const mindMapStore = useMindMapStore()

const isCollapsed = ref(false)
const showStructures = ref(true)
const topic = ref('')
const structure = ref<'tree' | 'radial'>('tree')
const layoutOption = ref('mindmap')
const customPrompt = ref('')
const depth = ref(3)
const branches = ref(5)
const showAdvanced = ref(false)
const loading = ref(false)
const error = ref('')
const isRecommending = ref(false)
const progressMessage = ref('')
const progressPercent = ref(0)

const structures = MIND_MAP_STRUCTURES

const currentLayouts = computed(() => {
  const struct = structures.find(s => s.id === structure.value)
  return struct?.layouts || []
})

const recommendedLayout = computed(() => {
  return currentLayouts.value.find(l => l.recommended)?.id || currentLayouts.value[0]?.id || ''
})

watch(structure, () => {
  layoutOption.value = recommendedLayout.value
})

const hasConfig = computed(() => {
  return settingsStore.apiConfigs.length > 0
})

const currentMap = computed(() => mindMapStore.currentMap)

async function generate() {
  if (!topic.value || loading.value) return

  const config = settingsStore.getCurrentConfig()
  if (!config) {
    error.value = '请先配置 API'
    return
  }

  loading.value = true
  error.value = ''
  progressMessage.value = '正在连接 AI 服务...'
  progressPercent.value = 10

  try {
    const aiService = new AIService(config)
    
    setTimeout(() => {
      progressMessage.value = '正在生成思维导图结构...'
      progressPercent.value = 30
    }, 500)
    
    setTimeout(() => {
      progressMessage.value = '正在填充详细内容...'
      progressPercent.value = 60
    }, 1500)
    
    const result = await aiService.generateMindMap({
      topic: topic.value,
      structure: structure.value,
      customPrompt: customPrompt.value,
      depth: depth.value,
      branches: branches.value
    })

    progressMessage.value = '正在渲染思维导图...'
    progressPercent.value = 90

    // 根据 structure 和 layoutOption 确定最终的布局
    // structure: 'tree' 或 'radial'
    // layoutOption: 'mindmap', 'tree-right', 'tree-left', 'tree-down', 'radial'
    let finalStructure = structure.value
    let finalLayout = layoutOption.value
    
    // 如果选择了放射状结构，强制使用 radial 布局
    if (structure.value === 'radial') {
      finalStructure = 'radial'
      finalLayout = 'radial'
    }
    
    emit('generated', result, finalStructure, finalLayout)
    
    progressPercent.value = 100
    progressMessage.value = '生成完成！'
    
    topic.value = ''
    customPrompt.value = ''
    
    setTimeout(() => {
      progressMessage.value = ''
      progressPercent.value = 0
    }, 1000)
  } catch (err: any) {
    error.value = err.message || '生成失败，请检查配置'
    progressMessage.value = ''
    progressPercent.value = 0
  } finally {
    loading.value = false
  }
}

async function expandNode() {
  if (!props.selectedNode || loading.value) return

  const config = settingsStore.getCurrentConfig()
  if (!config) return

  loading.value = true
  error.value = ''
  progressMessage.value = '正在扩展节点...'
  progressPercent.value = 40

  try {
    const aiService = new AIService(config)
    const context = currentMap.value?.name || ''
    
    progressPercent.value = 70
    const children = await aiService.expandNode(props.selectedNode.label, context)
    
    progressPercent.value = 90
    progressMessage.value = '正在更新思维导图...'
    
    const expandedNode: MindNode = {
      ...props.selectedNode,
      children: [...(props.selectedNode.children || []), ...children]
    }

    emit('expanded', expandedNode)
    
    progressPercent.value = 100
    progressMessage.value = '扩展完成！'
    
    setTimeout(() => {
      progressMessage.value = ''
      progressPercent.value = 0
    }, 1000)
  } catch (err: any) {
    error.value = err.message || '扩展失败'
    progressMessage.value = ''
    progressPercent.value = 0
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 320px;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  position: relative;
  transition: width 0.3s ease;
}

.ai-panel.collapsed {
  width: 40px;
}

.toggle-panel-btn {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-primary);
  z-index: 10;
  transition: all 0.2s;
}

.toggle-panel-btn:hover {
  background: var(--bg-hover);
  left: -14px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.config-btn {
  padding: 4px 10px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.config-btn:hover {
  background: var(--bg-hover);
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.no-config {
  text-align: center;
  padding: 40px 20px;
}

.no-config p {
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 14px;
}

.primary-btn {
  padding: 8px 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: #ff8f3d;
}

.ai-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  margin-bottom: 6px;
}

.section-header label {
  margin: 0;
  cursor: pointer;
}

.input-group input,
.input-group textarea,
.layout-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
}

.input-group input:focus,
.input-group textarea:focus,
.layout-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(254, 127, 45, 0.1);
}

.input-group textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.4;
}

.label-tip {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 400;
  margin-left: 6px;
}

.structure-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.structure-card {
  padding: 8px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  background: var(--bg-primary);
}

.structure-card:hover {
  border-color: var(--accent-primary);
  background: var(--bg-hover);
}

.structure-card.active {
  border-color: var(--accent-primary);
  background: var(--accent-bg);
}

.structure-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.structure-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.layout-select {
  cursor: pointer;
}

.advanced-options {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.options-header {
  padding: 10px 12px;
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  user-select: none;
}

.options-header:hover {
  background: var(--bg-hover);
}

.toggle-icon {
  font-size: 10px;
  color: var(--text-secondary);
}

.options-content {
  padding: 12px;
  background: var(--bg-primary);
}

.options-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.option-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.option-group select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
}

.generate-actions {
  display: flex;
  gap: 8px;
}

.generate-btn,
.action-btn {
  flex: 1;
  padding: 10px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled),
.action-btn:hover:not(:disabled) {
  background: #ff8f3d;
}

.generate-btn:disabled,
.action-btn:disabled {
  background: var(--bg-hover);
  color: var(--text-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.node-actions {
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.node-actions h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-node {
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 8px;
  word-break: break-word;
}

.action-btn {
  width: 100%;
  background: var(--accent-secondary);
  color: var(--text-primary);
}

.error-message {
  margin-top: 12px;
  padding: 10px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: 6px;
  color: var(--danger-text);
  font-size: 12px;
}

.progress-container {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--accent-primary) 0%,
    var(--accent-secondary) 50%,
    var(--accent-primary) 100%
  );
  background-size: 200% 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.progress-message {
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  font-weight: 500;
}
</style>
