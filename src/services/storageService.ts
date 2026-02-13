const STORAGE_KEY = 'vmind_storage'
const ENCRYPTION_KEY = 'vmind_secret_key_2024'

// 简单的加密函数（实际项目中建议使用更强的加密）
function simpleEncrypt(text: string): string {
  return btoa(encodeURIComponent(text))
}

function simpleDecrypt(encrypted: string): string {
  try {
    return decodeURIComponent(atob(encrypted))
  } catch {
    return ''
  }
}

export const storageService = {
  // 保存数据
  save(key: string, data: any): void {
    try {
      const encrypted = simpleEncrypt(JSON.stringify(data))
      localStorage.setItem(`${STORAGE_KEY}_${key}`, encrypted)
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  },

  // 读取数据
  load<T>(key: string, defaultValue: T): T {
    try {
      const encrypted = localStorage.getItem(`${STORAGE_KEY}_${key}`)
      if (!encrypted) return defaultValue
      const decrypted = simpleDecrypt(encrypted)
      return decrypted ? JSON.parse(decrypted) : defaultValue
    } catch (error) {
      console.error('读取数据失败:', error)
      return defaultValue
    }
  },

  // 删除数据
  remove(key: string): void {
    localStorage.removeItem(`${STORAGE_KEY}_${key}`)
  },

  // 清空所有数据
  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_KEY))
      .forEach(key => localStorage.removeItem(key))
  }
}

