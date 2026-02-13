import type { APIConfig, AIMessage, AIGenerateOptions, MindNode } from '@/types'
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/constants'

export class AIService {
  private config: APIConfig

  constructor(config: APIConfig) {
    this.config = config
  }

  // 推荐结构类型
  async recommendStructure(topic: string, customPrompt?: string): Promise<{
    recommended: string
    reason: string
    alternatives: Array<{ structure: string; reason: string }>
  }> {
    let prompt = `请分析主题"${topic}"，推荐最适合的思维导图结构类型。

可选结构：
1. tree（树状结构）- 适合层级清晰的知识体系、组织架构
2. radial（放射状）- 适合头脑风暴、创意发散、多维度分析
3. fishbone（鱼骨图）- 适合问题分析、原因探究、因果关系
4. network（网络结构）- 适合复杂关系、知识图谱、相互依赖
5. timeline（时间轴）- 适合历史事件、项目规划、发展历程

请返回JSON格式：
{
  "recommended": "推荐的结构类型",
  "reason": "推荐理由（30字以内）",
  "alternatives": [
    {"structure": "备选结构1", "reason": "理由"},
    {"structure": "备选结构2", "reason": "理由"}
  ]
}`

    if (customPrompt && customPrompt.trim()) {
      prompt += `\n\n用户额外要求：${customPrompt.trim()}`
    }

    const messages: AIMessage[] = [
      { 
        role: 'system', 
        content: '你是一个思维导图结构分析专家。请根据主题特点推荐最合适的结构类型，返回纯JSON格式。' 
      },
      { role: 'user', content: prompt }
    ]

    const response = await this.callAI(messages)
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('解析推荐结果失败:', error)
    }

    // 默认推荐
    return {
      recommended: 'tree',
      reason: '经典树状结构，适合大多数场景',
      alternatives: [
        { structure: 'radial', reason: '可以尝试放射状结构' }
      ]
    }
  }

  // 生成思维导图
  async generateMindMap(options: AIGenerateOptions): Promise<MindNode> {
    const { topic, structure = 'tree', customPrompt, depth = 3, branches = 5 } = options

    // 根据结构类型生成不同的提示
    let structureGuide = ''
    let contentFocus = ''
    
    switch (structure) {
      case 'radial':
        structureGuide = '采用放射状结构，从中心主题向四周均匀发散，每个方向代表一个主要维度。'
        contentFocus = '每个维度要独立完整，体现不同视角的深入分析。'
        break
      case 'fishbone':
        structureGuide = '采用鱼骨图结构，主题作为"鱼头"，主要分类作为"主骨"，具体原因/方法作为"小骨"。'
        contentFocus = '重点分析因果关系、影响因素，每个分支要有具体的分析点和解决方案。'
        break
      case 'network':
        structureGuide = '采用网络结构，节点之间可以有交叉关联，体现复杂的相互关系和依赖。'
        contentFocus = '强调知识点之间的关联性、依赖关系，体现系统性思维。'
        break
      case 'timeline':
        structureGuide = '采用时间轴结构，按照时间顺序或发展阶段组织内容，体现演进过程。'
        contentFocus = '每个阶段要包含关键事件、里程碑、重要变化，体现发展脉络。'
        break
      default:
        structureGuide = '采用经典树状结构，清晰的层级关系，从总到分。'
        contentFocus = '体现知识的层次递进，从概念到方法到实践。'
    }

    // 构建详细的用户提示词
    let userPrompt = `请为主题"${topic}"生成一个深度思维导图。

结构要求：
- ${structureGuide}
- 目标深度：${depth}层（充分利用每一层）
- 每个分支：${branches}个左右的子节点
- ${contentFocus}

内容深度要求（关键）：
1. 节点标签要具体详细，不要只写关键词
2. 使用"："或"-"添加说明，例如："核心概念：响应式系统的底层实现"
3. 包含具体的技术点、方法论、最佳实践
4. 深层节点要有实际的知识内容，不要空泛
5. 体现知识的逻辑递进关系

内容示例参考：
- 好的节点："组件通信：Props/Emit/Provide/Inject四种方式"
- 好的节点："性能优化：虚拟滚动、懒加载、Tree-shaking"
- 好的节点："状态管理：Vuex迁移到Pinia的最佳实践"
- 差的节点："基础"、"进阶"、"工具"（太笼统）

请生成内容丰富、有深度的思维导图，返回JSON格式。`

    // 如果用户提供了自定义提示，将其作为内容生成的指导
    if (customPrompt && customPrompt.trim()) {
      userPrompt += `

用户特殊要求（在生成内容时重点考虑）：
${customPrompt.trim()}`
    }

    const messages: AIMessage[] = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.callAI(messages)
    return this.parseResponse(response, topic)
  }

  // 扩展节点
  async expandNode(nodeLabel: string, context: string): Promise<MindNode[]> {
    const prompt = `在思维导图"${context}"中，需要扩展"${nodeLabel}"节点。

要求：
1. 生成3-5个相关的子节点
2. 每个子节点要具体详细，不要只是关键词
3. 使用"："或"-"添加说明，例如："核心API：ref/reactive/computed的使用场景"
4. 包含具体的知识点、方法、技巧或案例
5. 返回JSON数组格式：[{"label": "详细的子节点1"}, {"label": "详细的子节点2"}]

示例：
好的扩展：[
  {"label": "响应式原理：Proxy代理实现数据劫持和依赖收集"},
  {"label": "Composition API：setup函数和组合式函数的最佳实践"},
  {"label": "生命周期：onMounted/onUpdated等钩子的使用时机"}
]

差的扩展：[{"label": "原理"}, {"label": "API"}, {"label": "生命周期"}]（太简单）

请生成有深度的扩展内容。`

    const messages: AIMessage[] = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]

    const response = await this.callAI(messages)
    return this.parseArrayResponse(response)
  }

  // 优化思维导图结构
  async optimizeStructure(currentMap: MindNode): Promise<MindNode> {
    const prompt = `请优化以下思维导图的结构，使其更加清晰和有逻辑：
${JSON.stringify(currentMap, null, 2)}

返回优化后的JSON结构。`

    const messages: AIMessage[] = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]

    const response = await this.callAI(messages)
    return this.parseResponse(response, currentMap.label)
  }

  // 对话功能（公开方法）
  async chat(userMessage: string, context: string, history: Array<{role: string, content: string}>): Promise<{
    message: string
    action?: {
      type: 'create' | 'update' | 'add_branch'
      data: any
    }
  }> {
    const systemPrompt = `你是一个思维导图 AI Agent，像 Trae 和 Cursor 中的 AI 一样直接帮用户完成操作。

当前上下文：
${context}

你的能力：
1. 创建新的思维导图 - 直接生成完整的思维导图结构
2. 在现有思维导图中添加分支 - 直接添加新的分支节点
3. 修改和优化思维导图结构 - 直接更新思维导图
4. 如果无法完成操作，直接说明原因

重要规则：
- 不要返回代码或 JSON 文本给用户看
- 不要解释如何操作，直接执行
- 用简短的话说明你要做什么（不超过30字）
- 如果能做到，必须返回操作指令；如果做不到，直接说明原因

如果用户的请求需要操作思维导图，你必须：
1. 用一句话简短说明你要做什么（不超过30字）
2. 在回复的最后一行添加操作指令：ACTION: {完整的JSON对象}

data 格式要求：
- create: 完整的 MindNode 结构，必须包含 id, label, children
- update: 完整的 MindNode 结构，必须包含 id, label, children
- add_branch: 新分支的 MindNode 结构，必须包含 id, label

节点 ID 生成规则：使用 "node_" + 时间戳 + 随机字符串

示例回复格式（必须严格遵守）：
"好的，我来为你优化当前思维导图的结构。
ACTION: {"type": "update", "data": {"id": "node_1234567890_abc", "label": "Python 编程", "children": [{"id": "node_1234567891_def", "label": "基础语法", "children": []}]}}"

如果做不到：
"抱歉，当前没有思维导图，无法优化结构。请先创建一个思维导图。"`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: userMessage }
    ]

    const response = await this.callAI(messages)
    
    console.log('AI 原始响应:', response)
    
    // 解析响应，检查是否有操作指令
    // 匹配 ACTION: 后面的 JSON，可能跨多行
    const actionMatch = response.match(/ACTION:\s*(\{[\s\S]*\})/)
    
    if (actionMatch) {
      try {
        console.log('匹配到 ACTION:', actionMatch[1])
        const action = JSON.parse(actionMatch[1])
        const message = response.replace(/ACTION:\s*\{[\s\S]*\}/, '').trim()
        console.log('解析后的 action:', action)
        console.log('解析后的 message:', message)
        return { message, action }
      } catch (e) {
        console.error('解析操作指令失败:', e)
        console.error('尝试解析的内容:', actionMatch[1])
      }
    }
    
    console.log('未匹配到 ACTION，返回原始消息')
    return { message: response }
  }

  // 调用AI接口（私有方法）
  private async callAI(messages: AIMessage[]): Promise<string> {
    const { provider, apiKey, model, baseURL } = this.config
    
    let url = baseURL || ''
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    let body: any = {
      model,
      messages,
      temperature: 0.7
    }

    // 根据不同提供商设置请求格式
    if (provider === 'openai' || provider === 'deepseek' || provider === 'moonshot' || provider === 'aliyun') {
      url = `${url}/chat/completions`
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (provider === 'anthropic') {
      url = `${url}/messages`
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
      body = {
        model,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens: 4096
      }
    } else {
      // 自定义提供商，使用OpenAI格式
      url = `${url}/chat/completions`
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API请求失败: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // 解析不同提供商的响应格式
      if (provider === 'anthropic') {
        return data.content[0].text
      } else {
        return data.choices[0].message.content
      }
    } catch (error) {
      console.error('AI调用失败:', error)
      throw error
    }
  }

  // 解析AI响应为思维导图节点
  private parseResponse(response: string, fallbackLabel: string): MindNode {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return this.ensureNodeStructure(parsed)
      }
      throw new Error('无法解析JSON')
    } catch (error) {
      console.error('解析失败:', error)
      // 返回默认结构
      return {
        id: this.generateId(),
        label: fallbackLabel,
        children: [
          { id: this.generateId(), label: '解析失败，请重试' }
        ]
      }
    }
  }

  // 解析数组响应
  private parseArrayResponse(response: string): MindNode[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map((item: any) => this.ensureNodeStructure(item))
      }
      throw new Error('无法解析JSON数组')
    } catch (error) {
      console.error('解析失败:', error)
      return []
    }
  }

  // 确保节点结构完整
  private ensureNodeStructure(node: any): MindNode {
    const result: MindNode = {
      id: node.id || this.generateId(),
      label: node.label || node.name || '未命名',
      children: []
    }

    if (node.children && Array.isArray(node.children)) {
      result.children = node.children.map((child: any) => 
        this.ensureNodeStructure(child)
      )
    }

    return result
  }

  // 生成唯一ID
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

