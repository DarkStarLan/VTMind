<template>
  <div class="settings-panel" v-if="show">
    <div class="settings-overlay" @click="close"></div>
    <div class="settings-content">
      <div class="settings-header">
        <h2>API 配置</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="settings-body">
        <div class="config-list">
          <div 
            v-for="(config, index) in settingsStore.apiConfigs" 
            :key="config.provider"
            class="config-item"
            :class="{ active: index === settingsStore.currentConfigIndex }"
            @click="settingsStore.switchConfig(index)"
          >
            <div class="config-info">
              <div class="config-name">{{ getProviderName(config.provider) }}</div>
              <div class="config-model">{{ config.model }}</div>
            </div>
            <button class="delete-btn" @click.stop="deleteConfig(config.provider)">删除</button>
          </div>
        </div>

        <div class="add-config">
          <h3>添加新配置</h3>
          <form @submit.prevent="addConfig">
            <div class="form-group">
              <label>AI 提供商</label>
              <select v-model="newConfig.provider" @change="onProviderChange">
                <option value="">请选择</option>
                <option v-for="provider in AI_PROVIDERS" :key="provider.id" :value="provider.id">
                  {{ provider.name }}
                </option>
              </select>
            </div>

            <div class="form-group" v-if="newConfig.provider === 'custom'">
              <label>API 地址</label>
              <input 
                v-model="newConfig.baseURL" 
                type="text" 
                placeholder="https://api.example.com/v1"
                required
              />
            </div>

            <div class="form-group">
              <label>API Key</label>
              <input 
                v-model="newConfig.apiKey" 
                type="password" 
                placeholder="sk-..."
                required
              />
            </div>

            <div class="form-group">
              <label>模型</label>
              <input 
                v-model="newConfig.model" 
                type="text" 
                :placeholder="modelPlaceholder"
                required
              />
            </div>

            <button type="submit" class="submit-btn">保存配置</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { AI_PROVIDERS } from '@/utils/constants'
import type { APIConfig } from '@/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const settingsStore = useSettingsStore()

const newConfig = ref<Partial<APIConfig>>({
  provider: '',
  apiKey: '',
  model: '',
  baseURL: ''
})

const modelPlaceholder = computed(() => {
  const provider = AI_PROVIDERS.find(p => p.id === newConfig.value.provider)
  return provider?.models[0] || '请输入模型名称'
})

function onProviderChange() {
  const provider = AI_PROVIDERS.find(p => p.id === newConfig.value.provider)
  if (provider) {
    newConfig.value.baseURL = provider.baseURL
    newConfig.value.model = provider.models[0] || ''
  }
}

function addConfig() {
  if (!newConfig.value.provider || !newConfig.value.apiKey || !newConfig.value.model) {
    alert('请填写完整信息')
    return
  }

  const config: APIConfig = {
    provider: newConfig.value.provider,
    apiKey: newConfig.value.apiKey,
    model: newConfig.value.model,
    baseURL: newConfig.value.baseURL
  }

  settingsStore.saveConfig(config)
  
  // 重置表单
  newConfig.value = {
    provider: '',
    apiKey: '',
    model: '',
    baseURL: ''
  }

  alert('配置已保存')
}

function deleteConfig(provider: string) {
  if (confirm('确定删除此配置？')) {
    settingsStore.deleteConfig(provider)
  }
}

function getProviderName(id: string): string {
  return AI_PROVIDERS.find(p => p.id === id)?.name || id
}

function close() {
  emit('close')
}
</script>

<style scoped>
.settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.settings-content {
  position: relative;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.settings-body {
  padding: 24px;
  overflow-y: auto;
}

.config-list {
  margin-bottom: 32px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-primary);
}

.config-item:hover {
  border-color: var(--accent-primary);
}

.config-item.active {
  border-color: var(--accent-primary);
  background: var(--accent-bg);
}

.config-info {
  flex: 1;
}

.config-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.config-model {
  font-size: 14px;
  color: var(--text-secondary);
}

.delete-btn {
  padding: 6px 12px;
  background: var(--danger-bg);
  color: var(--danger-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.delete-btn:hover {
  opacity: 0.8;
}

.add-config h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(254, 127, 45, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #ff8f3d;
}

.submit-btn:active {
  transform: scale(0.98);
}
</style>

