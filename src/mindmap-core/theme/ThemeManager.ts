/**
 * 主题管理器 - 负责管理主题
 */

import type { ThemeConfig } from '../types'
import { PRESET_THEMES } from '../constants'
import { merge } from '../utils'

export class ThemeManager {
  private themes = new Map<string, ThemeConfig>()
  private currentTheme: ThemeConfig
  private currentThemeId: string = 'default'
  
  constructor() {
    // 加载预设主题
    Object.entries(PRESET_THEMES).forEach(([id, theme]) => {
      this.themes.set(id, theme as ThemeConfig)
    })
    
    // 设置默认主题
    this.currentTheme = this.themes.get('default')!
  }
  
  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig {
    // 如果是简约主题，根据当前系统主题动态生成
    if (this.currentThemeId === 'minimal') {
      return this.getMinimalTheme()
    }
    return this.currentTheme
  }
  
  /**
   * 获取简约主题（根据当前深色/浅色模式）
   */
  private getMinimalTheme(): ThemeConfig {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    
    if (isDark) {
      return {
        name: '极简',
        global: {
          backgroundColor: '#1e1e1e',
          fontFamily: 'Arial, sans-serif',
        },
        nodeStyles: {
          root: {
            backgroundColor: 'transparent',
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            borderColor: '#fff',
            borderWidth: 2,
            borderRadius: 0,
            padding: [10, 20],
          },
          level1: {
            backgroundColor: 'transparent',
            color: '#e0e0e0',
            fontSize: 16,
            borderColor: '#e0e0e0',
            borderWidth: 1,
            borderRadius: 0,
            padding: [8, 16],
          },
          default: {
            backgroundColor: 'transparent',
            color: '#bbb',
            fontSize: 14,
            borderColor: '#888',
            borderWidth: 1,
            borderRadius: 0,
            padding: [6, 12],
          },
        },
        edgeStyle: {
          color: '#fff',
          width: 1,
          curve: 'straight' as const,
        },
        colorScheme: ['#fff', '#e0e0e0', '#bbb', '#888', '#666', '#444'],
      }
    } else {
      return {
        name: '极简',
        global: {
          backgroundColor: '#fff',
          fontFamily: 'Arial, sans-serif',
        },
        nodeStyles: {
          root: {
            backgroundColor: 'transparent',
            color: '#000',
            fontSize: 20,
            fontWeight: 'bold',
            borderColor: '#000',
            borderWidth: 2,
            borderRadius: 0,
            padding: [10, 20],
          },
          level1: {
            backgroundColor: 'transparent',
            color: '#333',
            fontSize: 16,
            borderColor: '#333',
            borderWidth: 1,
            borderRadius: 0,
            padding: [8, 16],
          },
          default: {
            backgroundColor: 'transparent',
            color: '#666',
            fontSize: 14,
            borderColor: '#999',
            borderWidth: 1,
            borderRadius: 0,
            padding: [6, 12],
          },
        },
        edgeStyle: {
          color: '#000',
          width: 1,
          curve: 'straight' as const,
        },
        colorScheme: ['#000', '#333', '#666', '#999', '#bbb', '#ddd'],
      }
    }
  }
  
  /**
   * 设置主题
   */
  setTheme(themeOrId: string | ThemeConfig): void {
    if (typeof themeOrId === 'string') {
      this.currentThemeId = themeOrId
      const theme = this.themes.get(themeOrId)
      if (theme) {
        this.currentTheme = theme
      }
    } else {
      this.currentThemeId = 'custom'
      this.currentTheme = themeOrId
    }
  }
  
  /**
   * 注册主题
   */
  registerTheme(id: string, theme: ThemeConfig): void {
    this.themes.set(id, theme)
  }
  
  /**
   * 获取主题
   */
  getTheme(id: string): ThemeConfig | undefined {
    return this.themes.get(id)
  }
  
  /**
   * 获取所有主题
   */
  getAllThemes(): Map<string, ThemeConfig> {
    return new Map(this.themes)
  }
  
  /**
   * 扩展主题
   */
  extendTheme(baseThemeId: string, overrides: Partial<ThemeConfig>): ThemeConfig {
    const baseTheme = this.themes.get(baseThemeId)
    if (!baseTheme) {
      throw new Error(`Theme ${baseThemeId} not found`)
    }
    
    return merge({}, baseTheme, overrides)
  }
  
  /**
   * 删除主题
   */
  removeTheme(id: string): void {
    this.themes.delete(id)
  }
}

