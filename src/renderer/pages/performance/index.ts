import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import App from './app.vue';

import 'element-plus/theme-chalk/index.css';

createApp(App).use(ElementPlus).mount('#app');
