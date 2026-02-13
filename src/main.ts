import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import './assets/fonts.css' // 导入自定义字体
import './assets/jsmind-enhance.css' // 导入 jsMind 增强样式

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

