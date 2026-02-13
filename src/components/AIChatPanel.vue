<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h3>AI 对话助手</h3>
      <button class="close-btn" @click="emit('close')" title="返回">×</button>
    </div>

    <div class="chat-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">AI</div>
        <h4>欢迎使用 AI 对话助手</h4>
        <p>直接告诉我你想做什么，我会帮你完成操作</p>
        <div class="example-prompts">
          <div class="example-prompt" @click="sendExample('帮我创建一个关于 Python 编程的思维导图')">
            创建思维导图
          </div>
          <div class="example-prompt" @click="sendExample('帮我在当前思维导图中添加一个关于性能优化的分支')">
            添加分支
          </div>
          <div class="example-prompt" @click="sendExample('帮我优化当前思维导图的结构')">
            优化结构
          </div>
        </div>
      </div>

      <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
        <div class="message-avatar">
          {{ message.role === 'user' ? '我' : 'AI' }}
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div v-if="message.status" class="message-status" :class="message.status">
            {{ getStatusText(message.status) }}
          </div>
        </div>
      </div>

      <div v-if="loading" class="message assistant">
        <div class="message-avatar">AI</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          placeholder="输入你的问题或指令..."
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="inputMessage += '\n'"
          rows="1"
          ref="inputRef"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || loading">
          <span v-if="!loading">发送</span>
          <span v-else>...</span>
        </button>
      </div>
      <div class="input-hint">按 Enter 发送，Shift + Enter 换行</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMindMapStore } from '@/stores/mindMapStore'
import { AIService } from '@/services/aiService'
import Dialog from './Dialog.vue'
import type { MindNode } from '@/types'

const emit = defineEmits<{
  close: []
  generated: [data: MindNode, structure: string, layoutOption: string]
  updated: [data: MindNode]
}>()

const props = defineProps<{
  dialogRef?: InstanceType<typeof Dialog>
}>()

const settingsStore = useSettingsStore()
const mindMapStore = useMindMapStore()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  status?: 'success' | 'failed' | 'cancelled'
}

const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const loading = ref(false)
const error = ref('')
const messagesRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()

const currentMap = computed(() => mindMapStore.currentMap)

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return

  const config = settingsStore.getCurrentConfig()
  if (!config) {
    error.value = '请先配置 API'
    return
  }

  const userMessage = inputMessage.value.trim()
  messages.value.push({
    role: 'user',
    content: userMessage
  })

  inputMessage.value = ''
  loading.value = true
  error.value = ''

  await nextTick()
  scrollToBottom()

  try {
    const aiService = new AIService(config)
    
    // 构建上下文
    const context = buildContext()
    
    // 调用 AI
    const response = await aiService.chat(userMessage, context, messages.value.slice(0, -1))
    
    // 检查是否有操作
    if (response.action) {
      // 有操作：询问用户是否执行
      const actionDesc = getActionDescription(response.action.type, response.action.data)
      const confirmed = props.dialogRef 
        ? await props.dialogRef.confirm(`${response.message}\n\n${actionDesc}`, '确认操作')
        : confirm(`${response.message}\n\n${actionDesc}\n\n是否执行此操作？`)
      
      if (confirmed) {
        // 用户确认，执行操作
        try {
          await executeAction(response.action)
          messages.value.push({
            role: 'assistant',
            content: response.message,
            status: 'success'
          })
        } catch (err: any) {
          messages.value.push({
            role: 'assistant',
            content: response.message + '\n\n执行失败：' + err.message,
            status: 'failed'
          })
        }
      } else {
        // 用户取消
        messages.value.push({
          role: 'assistant',
          content: response.message,
          status: 'cancelled'
        })
      }
    } else {
      // 没有操作：直接显示回复
      messages.value.push({
        role: 'assistant',
        content: response.message
      })
    }
    
    await nextTick()
    scrollToBottom()
  } catch (err: any) {
    error.value = err.message || '发送失败'
    setTimeout(() => {
      error.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

function sendExample(text: string) {
  inputMessage.value = text
  sendMessage()
}

function buildContext(): string {
  let context = '当前状态：\n'
  
  if (currentMap.value) {
    context += `- 已有思维导图：${currentMap.value.name}\n`
    context += `- 结构类型：${currentMap.value.structure}\n`
    context += `- 节点数量：${countNodes(currentMap.value.root)}\n`
  } else {
    context += '- 当前没有思维导图\n'
  }
  
  return context
}

function countNodes(node: MindNode): number {
  let count = 1
  if (node.children) {
    node.children.forEach(child => {
      count += countNodes(child)
    })
  }
  return count
}

function getActionDescription(type: string, data: any): string {
  switch (type) {
    case 'create':
      return `将创建新的思维导图：${data.label || '未命名'}`
    case 'update':
      return '将更新当前思维导图的内容'
    case 'add_branch':
      return `将添加新分支：${data.label || '未命名'}`
    default:
      return '将执行操作'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'success':
      return '√ 已完成'
    case 'failed':
      return '× 执行失败'
    case 'cancelled':
      return '已取消'
    default:
      return ''
  }
}

async function executeAction(action: any) {
  if (action.type === 'create') {
    emit('generated', action.data, 'tree', 'mindmap')
  } else if (action.type === 'update') {
    emit('updated', action.data)
  } else if (action.type === 'add_branch') {
    // 添加分支逻辑
    if (currentMap.value) {
      const updatedRoot = addBranchToNode(currentMap.value.root, action.data)
      emit('updated', updatedRoot)
    } else {
      throw new Error('当前没有思维导图，无法添加分支')
    }
  }
}

function addBranchToNode(node: MindNode, branchData: any): MindNode {
  // 简单实现：添加到根节点
  return {
    ...node,
    children: [...(node.children || []), branchData]
  }
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 420px;
  min-width: 420px;
  max-width: 420px;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 6px;
  font-size: 18px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--bg-hover);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  max-width: 500px;
  margin: auto;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
  font-weight: bold;
  color: var(--accent-primary);
}

.welcome-message h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--text-primary);
}

.welcome-message p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.example-prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-prompt {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 14px;
}

.example-prompt:hover {
  background: var(--bg-hover);
  border-color: var(--accent-primary);
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  color: var(--text-primary);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .message-text {
  background: var(--accent-primary);
  color: white;
  border-radius: 12px 12px 0 12px;
}

.message.assistant .message-text {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 12px 12px 12px 0;
}

.message-status {
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.message-status.success {
  background: var(--success-bg);
  color: var(--success-text);
}

.message-status.failed {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.message-status.cancelled {
  background: var(--bg-hover);
  color: var(--text-tertiary);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 12px 12px 12px 0;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.error-message {
  margin-bottom: 8px;
  padding: 8px 12px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: 6px;
  color: var(--danger-text);
  font-size: 13px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.input-wrapper textarea {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: none;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.5;
}

.input-wrapper textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(254, 127, 45, 0.1);
}

.send-btn {
  padding: 10px 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: #ff8f3d;
}

.send-btn:disabled {
  background: var(--bg-hover);
  color: var(--text-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-hint {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: center;
}
</style>

