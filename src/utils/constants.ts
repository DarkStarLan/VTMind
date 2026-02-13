import type { AIProvider } from '@/types'

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseURL: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    baseURL: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  {
    id: 'aliyun',
    name: '阿里云百炼',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max']
  },
  {
    id: 'custom',
    name: '自定义',
    baseURL: '',
    models: []
  }
]

export const DEFAULT_SYSTEM_PROMPT = `你是一个专业的思维导图生成助手，擅长深度分析和知识体系构建。

核心要求：
1. 必须返回纯JSON格式，不要包含任何其他文字
2. JSON结构：{"label": "主题", "children": [子节点数组]}
3. 每个节点包含label和children字段

内容深度要求（重要）：
1. 避免流水账式的简单罗列，要有深度和层次
2. 每个节点的label要具体、有信息量，不要只是简单的关键词
3. 可以在label中包含简短说明，用"："或"-"分隔，例如：
   - "响应式原理：Proxy代理实现数据劫持"
   - "组件通信 - Props/Emit/Provide"
   - "性能优化：虚拟列表、懒加载、代码分割"
4. 深层节点要包含具体的知识点、方法、技巧或案例
5. 体现知识之间的逻辑关系和递进关系
6. 适当添加关键技术术语、最佳实践、注意事项

内容组织原则：
- 第1层：主要维度/模块（3-6个）
- 第2层：具体分类/概念（每个3-5个）
- 第3层：详细知识点/实践方法（每个2-4个）
- 第4层：补充说明/进阶内容（可选）

示例对比：
❌ 差：{"label": "基础", "children": [{"label": "语法"}]}
✅ 好：{"label": "核心基础", "children": [{"label": "ES6+语法：解构、箭头函数、Promise", "children": [{"label": "解构赋值：数组和对象的快速提取"}]}]}

重要：即使用户提供了额外要求，也必须保持JSON格式。用户要求仅用于指导内容方向和风格。`

export const MIND_MAP_STRUCTURES = [
  {
    id: 'tree',
    name: '树状结构',
    description: '经典的层级树状结构，适合表达清晰的层级关系',
    icon: '树',
    layouts: [
      {
        id: 'mindmap',
        name: '两侧展开',
        description: '左右两侧展开，自动平衡分布，适合节点较多的情况',
        recommended: true
      },
      {
        id: 'tree-right',
        name: '向右展开',
        description: '从左向右单侧展开，适合节点较少的情况',
        recommended: false
      },
      {
        id: 'tree-left',
        name: '向左展开',
        description: '从右向左单侧展开',
        recommended: false
      },
      {
        id: 'tree-down',
        name: '向下展开',
        description: '从上到下展开，适合流程图',
        recommended: false
      }
    ]
  },
  {
    id: 'radial',
    name: '放射状结构',
    description: '从中心向四周发散，适合头脑风暴和创意思考',
    icon: '星',
    layouts: [
      {
        id: 'radial',
        name: '放射状',
        description: '节点均匀分布在圆周上',
        recommended: true
      }
    ]
  }
]

