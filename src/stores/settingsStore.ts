import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { APIConfig } from '@/types'
import { storageService } from '@/services/storageService'
import { AI_PROVIDERS } from '@/utils/constants'

export const useSettingsStore = defineStore('settings', () => {
  const apiConfigs = ref<APIConfig[]>([])
  const currentConfigIndex = ref(0)
  const showSettings = ref(false)
  const theme = ref<'light' | 'dark'>('light')

  // 初始化
  function init() {
    const saved = storageService.load<APIConfig[]>('api_configs', [])
    if (saved.length > 0) {
      apiConfigs.value = saved
    }
    
    // 加载主题设置
    const savedTheme = storageService.load<'light' | 'dark'>('theme', 'light')
    theme.value = savedTheme
    applyTheme(savedTheme)
  }
  
  // 应用主题
  function applyTheme(newTheme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  // 切换主题
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)
    storageService.save('theme', theme.value)
  }
  
  // 监听主题变化
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  // 保存配置
  function saveConfig(config: APIConfig) {
    const index = apiConfigs.value.findIndex(c => c.provider === config.provider)
    if (index >= 0) {
      apiConfigs.value[index] = config
    } else {
      apiConfigs.value.push(config)
    }
    storageService.save('api_configs', apiConfigs.value)
  }

  // 删除配置
  function deleteConfig(provider: string) {
    apiConfigs.value = apiConfigs.value.filter(c => c.provider !== provider)
    storageService.save('api_configs', apiConfigs.value)
    if (currentConfigIndex.value >= apiConfigs.value.length) {
      currentConfigIndex.value = Math.max(0, apiConfigs.value.length - 1)
    }
  }

  // 获取当前配置
  function getCurrentConfig(): APIConfig | null {
    return apiConfigs.value[currentConfigIndex.value] || null
  }

  // 切换配置
  function switchConfig(index: number) {
    if (index >= 0 && index < apiConfigs.value.length) {
      currentConfigIndex.value = index
    }
  }

  // 获取提供商信息
  function getProvider(id: string) {
    return AI_PROVIDERS.find(p => p.id === id)
  }

  return {
    apiConfigs,
    currentConfigIndex,
    showSettings,
    theme,
    init,
    saveConfig,
    deleteConfig,
    getCurrentConfig,
    switchConfig,
    getProvider,
    toggleTheme
  }
})

