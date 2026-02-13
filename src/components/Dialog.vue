<template>
  <!-- 确认对话框 -->
  <div v-if="confirmDialog.visible" class="dialog-overlay" @click="closeConfirm">
    <div class="dialog-box" @click.stop>
      <div class="dialog-header">
        <h3>{{ confirmDialog.title }}</h3>
      </div>
      <div class="dialog-body">
        <p>{{ confirmDialog.message }}</p>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="closeConfirm">取消</button>
        <button class="btn-confirm" @click="handleConfirm">确定</button>
      </div>
    </div>
  </div>

  <!-- 提示对话框 -->
  <div v-if="promptDialog.visible" class="dialog-overlay" @click="closePrompt">
    <div class="dialog-box" @click.stop>
      <div class="dialog-header">
        <h3>{{ promptDialog.title }}</h3>
      </div>
      <div class="dialog-body">
        <p v-if="promptDialog.message">{{ promptDialog.message }}</p>
        <input 
          v-model="promptDialog.inputValue" 
          type="text"
          :placeholder="promptDialog.placeholder"
          @keydown.enter="handlePrompt"
          ref="promptInput"
        />
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="closePrompt">取消</button>
        <button class="btn-confirm" @click="handlePrompt">确定</button>
      </div>
    </div>
  </div>

  <!-- 警告对话框 -->
  <div v-if="alertDialog.visible" class="dialog-overlay" @click="closeAlert">
    <div class="dialog-box" @click.stop>
      <div class="dialog-header">
        <h3>{{ alertDialog.title }}</h3>
      </div>
      <div class="dialog-body">
        <p>{{ alertDialog.message }}</p>
      </div>
      <div class="dialog-footer">
        <button class="btn-confirm" @click="closeAlert">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick } from 'vue'

const promptInput = ref<HTMLInputElement>()

const confirmDialog = reactive({
  visible: false,
  title: '确认',
  message: '',
  resolve: null as ((value: boolean) => void) | null
})

const promptDialog = reactive({
  visible: false,
  title: '输入',
  message: '',
  placeholder: '',
  inputValue: '',
  resolve: null as ((value: string | null) => void) | null
})

const alertDialog = reactive({
  visible: false,
  title: '提示',
  message: '',
  resolve: null as (() => void) | null
})

function confirm(message: string, title = '确认'): Promise<boolean> {
  return new Promise((resolve) => {
    confirmDialog.visible = true
    confirmDialog.title = title
    confirmDialog.message = message
    confirmDialog.resolve = resolve
  })
}

function prompt(message: string, defaultValue = '', title = '输入', placeholder = ''): Promise<string | null> {
  return new Promise((resolve) => {
    promptDialog.visible = true
    promptDialog.title = title
    promptDialog.message = message
    promptDialog.placeholder = placeholder
    promptDialog.inputValue = defaultValue
    promptDialog.resolve = resolve
    
    nextTick(() => {
      promptInput.value?.focus()
      promptInput.value?.select()
    })
  })
}

function alert(message: string, title = '提示'): Promise<void> {
  return new Promise((resolve) => {
    alertDialog.visible = true
    alertDialog.title = title
    alertDialog.message = message
    alertDialog.resolve = resolve
  })
}

function closeConfirm() {
  confirmDialog.resolve?.(false)
  confirmDialog.visible = false
  confirmDialog.resolve = null
}

function handleConfirm() {
  confirmDialog.resolve?.(true)
  confirmDialog.visible = false
  confirmDialog.resolve = null
}

function closePrompt() {
  promptDialog.resolve?.(null)
  promptDialog.visible = false
  promptDialog.resolve = null
}

function handlePrompt() {
  promptDialog.resolve?.(promptDialog.inputValue)
  promptDialog.visible = false
  promptDialog.resolve = null
}

function closeAlert() {
  alertDialog.resolve?.()
  alertDialog.visible = false
  alertDialog.resolve = null
}

defineExpose({
  confirm,
  prompt,
  alert
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: overlayFadeIn 0.2s ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-box {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 450px;
  animation: dialogSlideIn 0.3s ease;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
}

.dialog-body {
  padding: 24px;
}

.dialog-body p {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  line-height: 1.6;
}

.dialog-body p:last-child {
  margin-bottom: 0;
}

.dialog-body input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: inherit;
}

.dialog-body input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(254, 127, 45, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.dialog-footer button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-confirm {
  background: var(--accent-primary);
  color: white;
}

.btn-confirm:hover {
  background: #ff8f3d;
}
</style>

