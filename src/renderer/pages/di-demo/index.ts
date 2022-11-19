import 'reflect-metadata';
import { createApp } from 'vue';
import App from './app.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import { setup } from './setup';

setup();

const app = createApp(App);

app.use(router).use(ElementPlus);

app.mount('#app');
