import G6 from '@antv/g6'

// 获取当前主题的文字颜色
function getTextColor(): string {
  const theme = document.documentElement.getAttribute('data-theme')
  return theme === 'dark' ? '#E8EDEF' : '#374151'
}

// 注册自定义节点：下划线样式
G6.registerNode('underline-node', {
  draw(cfg, group) {
    const label = cfg?.label as string || ''
    const fontSize = 14
    const padding = [8, 12]
    
    // 计算文本宽度
    const textWidth = G6.Util.getTextSize(label, fontSize)[0]
    const width = textWidth + padding[1] * 2
    const height = fontSize + padding[0] * 2
    
    // 绘制文本
    const text = group!.addShape('text', {
      attrs: {
        text: label,
        x: 0,
        y: 0,
        fontSize,
        textAlign: 'center',
        textBaseline: 'middle',
        fill: getTextColor(),
        cursor: 'move'
      },
      name: 'text-shape',
      draggable: true
    })
    
    // 绘制下划线
    group!.addShape('line', {
      attrs: {
        x1: -width / 2,
        y1: height / 2,
        x2: width / 2,
        y2: height / 2,
        stroke: '#3b82f6',
        lineWidth: 2,
        cursor: 'move'
      },
      name: 'underline-shape',
      draggable: true
    })
    
    // 添加背景框（用于交互）
    const keyShape = group!.addShape('rect', {
      attrs: {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        fill: 'transparent',
        cursor: 'move'
      },
      name: 'key-shape',
      draggable: true
    })
    
    return keyShape
  },
  
  update: undefined
}, 'single-node')

// 注册自定义节点：边框样式
G6.registerNode('outline-node', {
  draw(cfg, group) {
    const label = cfg?.label as string || ''
    const fontSize = 14
    const padding = [10, 16]
    
    const textWidth = G6.Util.getTextSize(label, fontSize)[0]
    const width = textWidth + padding[1] * 2
    const height = fontSize + padding[0] * 2
    
    // 绘制边框
    const keyShape = group!.addShape('rect', {
      attrs: {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        radius: 8,
        stroke: '#6366f1',
        lineWidth: 2,
        fill: '#fff',
        cursor: 'move'
      },
      name: 'key-shape',
      draggable: true
    })
    
    // 绘制文本
    group!.addShape('text', {
      attrs: {
        text: label,
        x: 0,
        y: 0,
        fontSize,
        textAlign: 'center',
        textBaseline: 'middle',
        fill: '#6366f1',
        cursor: 'move'
      },
      name: 'text-shape',
      draggable: true
    })
    
    return keyShape
  },
  
  update: undefined
}, 'single-node')

// 注册自定义节点：圆形样式
G6.registerNode('circle-node', {
  draw(cfg, group) {
    const label = cfg?.label as string || ''
    const fontSize = 13
    
    // 计算文本宽度，取较大值作为直径
    const textWidth = G6.Util.getTextSize(label, fontSize)[0]
    const radius = Math.max(textWidth / 2 + 20, 35)
    
    // 绘制圆形
    const keyShape = group!.addShape('circle', {
      attrs: {
        x: 0,
        y: 0,
        r: radius,
        fill: '#10b981',
        stroke: '#059669',
        lineWidth: 2,
        cursor: 'move'
      },
      name: 'key-shape',
      draggable: true
    })
    
    // 绘制文本（可能需要换行）
    const maxWidth = radius * 1.6
    const words = label.split('')
    let line = ''
    const lines: string[] = []
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const testWidth = G6.Util.getTextSize(testLine, fontSize)[0]
      
      if (testWidth > maxWidth && line !== '') {
        lines.push(line)
        line = words[i]
      } else {
        line = testLine
      }
    }
    lines.push(line)
    
    // 绘制多行文本
    const lineHeight = fontSize + 4
    const startY = -(lines.length - 1) * lineHeight / 2
    
    lines.forEach((lineText, index) => {
      group!.addShape('text', {
        attrs: {
          text: lineText,
          x: 0,
          y: startY + index * lineHeight,
          fontSize,
          textAlign: 'center',
          textBaseline: 'middle',
          fill: '#fff',
          cursor: 'move'
        },
        name: `text-shape-${index}`,
        draggable: true
      })
    })
    
    return keyShape
  },
  
  update: undefined
}, 'single-node')

// 注册自定义节点：菱形样式
G6.registerNode('diamond-node', {
  draw(cfg, group) {
    const label = cfg?.label as string || ''
    const fontSize = 13
    const padding = 20
    
    const textWidth = G6.Util.getTextSize(label, fontSize)[0]
    const size = Math.max(textWidth + padding * 2, 80)
    
    // 绘制菱形
    const keyShape = group!.addShape('path', {
      attrs: {
        path: [
          ['M', 0, -size / 2],
          ['L', size / 2, 0],
          ['L', 0, size / 2],
          ['L', -size / 2, 0],
          ['Z']
        ],
        fill: '#f59e0b',
        stroke: '#d97706',
        lineWidth: 2,
        cursor: 'move'
      },
      name: 'key-shape',
      draggable: true
    })
    
    // 绘制文本
    group!.addShape('text', {
      attrs: {
        text: label,
        x: 0,
        y: 0,
        fontSize,
        textAlign: 'center',
        textBaseline: 'middle',
        fill: '#fff',
        cursor: 'move'
      },
      name: 'text-shape',
      draggable: true
    })
    
    return keyShape
  },
  
  update: undefined
}, 'single-node')

// 注册自定义节点：标签样式
G6.registerNode('tag-node', {
  draw(cfg, group) {
    const label = cfg?.label as string || ''
    const fontSize = 13
    const padding = [8, 14]
    
    const textWidth = G6.Util.getTextSize(label, fontSize)[0]
    const width = textWidth + padding[1] * 2
    const height = fontSize + padding[0] * 2
    
    // 绘制标签背景
    const keyShape = group!.addShape('rect', {
      attrs: {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        radius: [4, 4, 4, 4],
        fill: '#ec4899',
        stroke: '#db2777',
        lineWidth: 1,
        cursor: 'move'
      },
      name: 'key-shape',
      draggable: true
    })
    
    // 绘制文本
    group!.addShape('text', {
      attrs: {
        text: label,
        x: 0,
        y: 0,
        fontSize,
        textAlign: 'center',
        textBaseline: 'middle',
        fill: '#fff',
        fontWeight: 500,
        cursor: 'move'
      },
      name: 'text-shape',
      draggable: true
    })
    
    return keyShape
  },
  
  update: undefined
}, 'single-node')

// 注册自适应矩形节点
G6.registerNode('adaptive-rect', {
  draw(cfg, group) {
    const label = cfg?.label as string || ''
    const fontSize = 14
    const padding = [12, 16]
    const maxWidth = 300
    
    // 处理长文本换行
    const words = label.split(/[:：\-—]/g)
    const lines: string[] = []
    
    if (words.length > 1) {
      // 有分隔符，按分隔符分行
      words.forEach((word, index) => {
        if (index === 0) {
          lines.push(word + (label.includes(':') || label.includes('：') ? ':' : ''))
        } else {
          lines.push(word)
        }
      })
    } else {
      // 没有分隔符，按宽度分行
      let currentLine = ''
      for (let i = 0; i < label.length; i++) {
        const testLine = currentLine + label[i]
        const testWidth = G6.Util.getTextSize(testLine, fontSize)[0]
        
        if (testWidth > maxWidth - padding[1] * 2) {
          if (currentLine) lines.push(currentLine)
          currentLine = label[i]
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)
    }
    
    // 计算节点尺寸
    const lineHeight = fontSize + 6
    const textWidths = lines.map(line => G6.Util.getTextSize(line, fontSize)[0])
    const width = Math.min(Math.max(...textWidths) + padding[1] * 2, maxWidth)
    const height = lines.length * lineHeight + padding[0] * 2
    
    // 绘制背景
    const keyShape = group!.addShape('rect', {
      attrs: {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        radius: 8,
        fill: '#5B8FF9',
        stroke: '#4a7fd6',
        lineWidth: 2,
        cursor: 'move',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 4,
        shadowOffsetY: 2
      },
      name: 'key-shape',
      draggable: true
    })
    
    // 绘制多行文本
    const startY = -(lines.length - 1) * lineHeight / 2
    
    lines.forEach((lineText, index) => {
      const isFirstLine = index === 0
      group!.addShape('text', {
        attrs: {
          text: lineText,
          x: 0,
          y: startY + index * lineHeight,
          fontSize: isFirstLine ? fontSize : fontSize - 1,
          textAlign: 'center',
          textBaseline: 'middle',
          fill: '#fff',
          fontWeight: isFirstLine ? 600 : 400,
          cursor: 'move'
        },
        name: `text-shape-${index}`,
        draggable: true
      })
    })
    
    return keyShape
  },
  
  update: undefined
}, 'single-node')

export {}

