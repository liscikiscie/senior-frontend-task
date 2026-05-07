import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { i18n, syncDocumentLang } from './i18n/index.js'

syncDocumentLang()
createApp(App).use(i18n).mount('#app')
