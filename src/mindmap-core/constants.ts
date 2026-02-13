/**
 * 常量定义
 */

// 默认配置
export const DEFAULT_CONFIG = {
  // 节点默认样式
  NODE: {
    width: 120,
    height: 40,
    padding: [8, 16],
    borderRadius: 4,
    borderWidth: 2,
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    color: '#333',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    shape: 'rounded',
  },
  
  // 连线默认样式
  EDGE: {
    WIDTH: 2,
    COLOR: '#999',
    CURVE: 'bezier' as const,
  },
  
  // 布局默认配置
  LAYOUT: {
    NODE_SPACING: 50,
    LEVEL_SPACING: 240,
    BRANCH_SPACING: 80,
  },
  
  // 交互默认配置
  INTERACTION: {
    DRAGGABLE: true,
    ZOOMABLE: true,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5,
    ZOOM_SPEED: 0.1,
    SELECTABLE: true,
    EDITABLE: true,
    COLLAPSIBLE: true,
  },
  
  // 动画默认配置
  ANIMATION: {
    ENABLED: true,
    DURATION: 300,
    EASING: 'ease-out' as const,
  },
  
  // 渲染默认配置
  RENDER: {
    PIXEL_RATIO: window.devicePixelRatio || 1,
    ANTIALIAS: true,
    ENABLE_CACHE: true,
  },
}

// 预设主题
export const PRESET_THEMES = {
  default: {
    name: '默认',
    global: {
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
    },
    nodeStyles: {
      root: {
        backgroundColor: '#4a90e2',
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        borderRadius: 8,
        padding: [12, 24],
      },
      level1: {
        backgroundColor: '#7cb342',
        color: '#fff',
        fontSize: 16,
        borderRadius: 6,
        padding: [10, 20],
      },
      level2: {
        backgroundColor: '#ffa726',
        color: '#fff',
        fontSize: 14,
        borderRadius: 4,
        padding: [8, 16],
      },
      default: {
        backgroundColor: '#fff',
        color: '#333',
        fontSize: 14,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 4,
        padding: [8, 16],
      },
    },
    edgeStyle: {
      color: '#999',
      width: 2,
      curve: 'bezier' as const,
    },
    colorScheme: ['#4a90e2', '#7cb342', '#ffa726', '#ef5350', '#ab47bc', '#26c6da'],
  },
  
  dark: {
    name: '暗黑',
    global: {
      backgroundColor: '#1e1e1e',
      fontFamily: 'Arial, sans-serif',
    },
    nodeStyles: {
      root: {
        backgroundColor: '#0d47a1',
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        borderRadius: 8,
        padding: [12, 24],
      },
      level1: {
        backgroundColor: '#1565c0',
        color: '#fff',
        fontSize: 16,
        borderRadius: 6,
        padding: [10, 20],
      },
      level2: {
        backgroundColor: '#1976d2',
        color: '#fff',
        fontSize: 14,
        borderRadius: 4,
        padding: [8, 16],
      },
      default: {
        backgroundColor: '#2d2d2d',
        color: '#e0e0e0',
        fontSize: 14,
        borderColor: '#444',
        borderWidth: 1,
        borderRadius: 4,
        padding: [8, 16],
      },
    },
    edgeStyle: {
      color: '#666',
      width: 2,
      curve: 'bezier' as const,
    },
    colorScheme: ['#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5'],
  },
  
  colorful: {
    name: '多彩',
    global: {
      backgroundColor: '#fafafa',
      fontFamily: 'Arial, sans-serif',
    },
    nodeStyles: {
      root: {
        backgroundColor: '#e91e63',
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        borderRadius: 20,
        padding: [12, 24],
      },
      level1: {
        backgroundColor: '#9c27b0',
        color: '#fff',
        fontSize: 16,
        borderRadius: 16,
        padding: [10, 20],
      },
      level2: {
        backgroundColor: '#3f51b5',
        color: '#fff',
        fontSize: 14,
        borderRadius: 12,
        padding: [8, 16],
      },
      default: {
        backgroundColor: '#fff',
        color: '#333',
        fontSize: 14,
        borderColor: '#e0e0e0',
        borderWidth: 2,
        borderRadius: 8,
        padding: [8, 16],
      },
    },
    edgeStyle: {
      color: '#bdbdbd',
      width: 3,
      curve: 'bezier' as const,
    },
    colorScheme: ['#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4', '#009688'],
  },
  
  minimal: {
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
  },
}

// 快捷键映射
export const SHORTCUTS = {
  DELETE: ['Delete', 'Backspace'],
  UNDO: ['Control+z', 'Meta+z'],
  REDO: ['Control+y', 'Meta+Shift+z'],
  COPY: ['Control+c', 'Meta+c'],
  PASTE: ['Control+v', 'Meta+v'],
  CUT: ['Control+x', 'Meta+x'],
  SELECT_ALL: ['Control+a', 'Meta+a'],
  ADD_CHILD: ['Tab', 'Insert'],
  ADD_SIBLING: ['Enter'],
  EDIT: ['F2', 'Space'],
  ZOOM_IN: ['Control+=', 'Meta+='],
  ZOOM_OUT: ['Control+-', 'Meta+-'],
  ZOOM_FIT: ['Control+0', 'Meta+0'],
  COLLAPSE: ['Control+/', 'Meta+/'],
}

// 缓动函数
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  ease: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
  elastic: (t: number) => {
    return t === 0 || t === 1
      ? t
      : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
  },
}

