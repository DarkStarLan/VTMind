import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MindMapData, MindNode } from '@/types'
import { storageService } from '@/services/storageService'

export const useMindMapStore = defineStore('mindMap', () => {
  const maps = ref<MindMapData[]>([])
  const currentMapId = ref<string>('')
  const history = ref<MindNode[]>([])
  const historyIndex = ref(-1)

  // 当前思维导图
  const currentMap = computed(() => {
    return maps.value.find(m => m.id === currentMapId.value)
  })

  // 初始化
  function init() {
    const savedMaps = storageService.load<MindMapData[]>('mind_maps', [])
    const savedCurrentId = storageService.load<string>('current_map_id', '')
    
    maps.value = savedMaps
    if (savedCurrentId && savedMaps.find(m => m.id === savedCurrentId)) {
      currentMapId.value = savedCurrentId
    } else if (savedMaps.length > 0) {
      currentMapId.value = savedMaps[0].id
    }
  }

  // 创建新思维导图
  function createMap(name: string, root: MindNode, structure?: 'tree' | 'radial' | 'fishbone' | 'network' | 'timeline', layoutOption?: string): string {
    const newMap: MindMapData = {
      id: `map_${Date.now()}`,
      name,
      root,
      structure: structure || 'tree',
      layoutOption: layoutOption || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    maps.value.push(newMap)
    currentMapId.value = newMap.id
    saveToStorage()
    initHistory(root)
    return newMap.id
  }

  // 更新思维导图
  function updateMap(root: MindNode) {
    const map = currentMap.value
    if (map) {
      map.root = root
      map.updatedAt = Date.now()
      saveToStorage()
      addToHistory(root)
    }
  }

  // 重命名思维导图
  function renameMap(id: string, name: string) {
    const map = maps.value.find(m => m.id === id)
    if (map) {
      map.name = name
      map.updatedAt = Date.now()
      saveToStorage()
    }
  }

  // 删除思维导图
  function deleteMap(id: string) {
    maps.value = maps.value.filter(m => m.id !== id)
    if (currentMapId.value === id) {
      currentMapId.value = maps.value.length > 0 ? maps.value[0].id : ''
    }
    saveToStorage()
  }

  // 切换思维导图
  function switchMap(id: string) {
    if (maps.value.find(m => m.id === id)) {
      currentMapId.value = id
      storageService.save('current_map_id', id)
      const map = currentMap.value
      if (map) {
        initHistory(map.root)
      }
    }
  }

  // 保存到本地存储
  function saveToStorage() {
    storageService.save('mind_maps', maps.value)
    storageService.save('current_map_id', currentMapId.value)
  }

  // 初始化历史记录
  function initHistory(root: MindNode) {
    history.value = [JSON.parse(JSON.stringify(root))]
    historyIndex.value = 0
  }

  // 添加到历史记录
  function addToHistory(root: MindNode) {
    // 移除当前位置之后的历史
    history.value = history.value.slice(0, historyIndex.value + 1)
    // 添加新状态
    history.value.push(JSON.parse(JSON.stringify(root)))
    historyIndex.value++
    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  // 撤销
  function undo() {
    if (canUndo.value) {
      historyIndex.value--
      const map = currentMap.value
      if (map) {
        map.root = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
        saveToStorage()
      }
    }
  }

  // 重做
  function redo() {
    if (canRedo.value) {
      historyIndex.value++
      const map = currentMap.value
      if (map) {
        map.root = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
        saveToStorage()
      }
    }
  }

  // 是否可以撤销
  const canUndo = computed(() => historyIndex.value > 0)

  // 是否可以重做
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  return {
    maps,
    currentMapId,
    currentMap,
    canUndo,
    canRedo,
    init,
    createMap,
    updateMap,
    renameMap,
    deleteMap,
    switchMap,
    saveToStorage,
    undo,
    redo
  }
})

