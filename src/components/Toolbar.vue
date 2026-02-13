<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="logo">
        <span class="logo-text">VTMind</span>
      </div>

      <div class="map-selector">
        <select v-model="currentMapId" @change="onMapChange">
          <option value="">新建思维导图</option>
          <option 
            v-for="map in mindMapStore.maps" 
            :key="map.id" 
            :value="map.id"
          >
            {{ map.name }}
          </option>
        </select>
      </div>

      <button 
        v-if="currentMapId" 
        class="toolbar-btn"
        @click="renameMap"
        title="重命名"
      >
        重命名
      </button>

      <button 
        v-if="currentMapId" 
        class="toolbar-btn danger"
        @click="deleteMap"
        title="删除"
      >
        删除
      </button>
    </div>

    <div class="toolbar-center">
      <button 
        class="toolbar-btn"
        @click="emit('undo')"
        :disabled="!mindMapStore.canUndo"
        title="撤销 (Ctrl+Z)"
      >
        撤销
      </button>

      <button 
        class="toolbar-btn"
        @click="emit('redo')"
        :disabled="!mindMapStore.canRedo"
        title="重做 (Ctrl+Y)"
      >
        重做
      </button>

      <div class="divider"></div>

      <button 
        class="toolbar-btn"
        @click="emit('zoomIn')"
        title="放大"
      >
        放大
      </button>

      <button 
        class="toolbar-btn"
        @click="emit('zoomOut')"
        title="缩小"
      >
        缩小
      </button>

      <button 
        class="toolbar-btn"
        @click="emit('fitView')"
        title="适应画布"
      >
        适应
      </button>

      <button 
        class="toolbar-btn"
        @click="emit('format')"
        title="格式化布局"
      >
        格式化
      </button>

      <div class="divider"></div>

      <button 
        class="toolbar-btn"
        @click="emit('export', 'json')"
        title="导出JSON"
      >
        导出JSON
      </button>

      <button 
        class="toolbar-btn"
        @click="emit('export', 'png')"
        title="导出图片"
      >
        导出图片
      </button>

      <button 
        class="toolbar-btn"
        @click="emit('import')"
        title="导入"
      >
        导入
      </button>
    </div>

    <div class="toolbar-right">
      <button 
        class="toolbar-btn ai-chat"
        @click="emit('openAIChat')"
        title="AI 对话助手"
      >
        AI 对话
      </button>
      
      <button 
        class="toolbar-btn theme-toggle"
        @click="toggleTheme"
        :title="settingsStore.theme === 'light' ? '切换到暗色模式' : '切换到浅色模式'"
      >
        {{ settingsStore.theme === 'light' ? '暗色' : '浅色' }}
      </button>
      
      <button 
        class="toolbar-btn settings"
        @click="emit('openSettings')"
        title="设置"
      >
        设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMindMapStore } from '@/stores/mindMapStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type Dialog from './Dialog.vue'

const props = defineProps<{
  dialogRef?: InstanceType<typeof Dialog>
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  zoomIn: []
  zoomOut: []
  fitView: []
  format: []
  export: [type: 'json' | 'png']
  import: []
  openSettings: []
  createNew: []
  openAIChat: []
}>()

const mindMapStore = useMindMapStore()
const settingsStore = useSettingsStore()
const currentMapId = ref(mindMapStore.currentMapId)

function toggleTheme() {
  settingsStore.toggleTheme()
}

watch(() => mindMapStore.currentMapId, (newId) => {
  currentMapId.value = newId
})

function onMapChange() {
  if (currentMapId.value) {
    mindMapStore.switchMap(currentMapId.value)
  } else {
    // 触发新建思维导图
    emit('createNew')
    // 如果没有创建成功，恢复到当前的 map
    setTimeout(() => {
      currentMapId.value = mindMapStore.currentMapId
    }, 100)
  }
}

async function renameMap() {
  if (!currentMapId.value) return
  const map = mindMapStore.maps.find(m => m.id === currentMapId.value)
  if (!map) return

  const newName = await props.dialogRef?.prompt('重命名思维导图:', map.name, '重命名')
  if (newName && newName !== map.name) {
    mindMapStore.renameMap(currentMapId.value, newName)
  }
}

async function deleteMap() {
  if (!currentMapId.value) return
  const map = mindMapStore.maps.find(m => m.id === currentMapId.value)
  if (!map) return

  const confirmed = await props.dialogRef?.confirm(`确定删除"${map.name}"？`, '确认删除')
  if (confirmed) {
    mindMapStore.deleteMap(currentMapId.value)
    currentMapId.value = mindMapStore.currentMapId
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
  font-weight: 700;
  font-size: 22px;
}

.logo-text {
  background: var(--gradient-logo);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.map-selector select {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  min-width: 200px;
  height: 36px;
  transition: all 0.2s;
}

.map-selector select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.toolbar-btn {
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  height: 36px;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.toolbar-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.danger:hover:not(:disabled) {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger-text);
}

.toolbar-btn.theme-toggle {
  padding: 8px 14px;
}

.toolbar-btn.settings {
  background: var(--accent-bg);
  border-color: var(--accent-border);
}

.toolbar-btn.settings:hover {
  background: var(--accent-bg-hover);
  border-color: var(--accent-border-hover);
}

.toolbar-btn.ai-chat {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
  font-weight: 600;
}

.toolbar-btn.ai-chat:hover {
  background: #ff8f3d;
  border-color: #ff8f3d;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 4px;
}
</style>

