import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@/styles/main.css'
import App from './App.vue'
import i18n from '@/core/i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Antd)
app.use(i18n)
app.mount('#app')
