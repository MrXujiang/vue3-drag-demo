import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue';
import App from './App.vue'


import Drager from 'es-drager'
import router from './router'


//需引入默认样式
import 'es-drager/lib/style.css'
import '@arco-design/web-vue/dist/arco.css';

const app = createApp(App)

app.use(createPinia())
app.use(router);
app.use(ArcoVue);
app.component('es-drager', Drager)
app.mount('#app')