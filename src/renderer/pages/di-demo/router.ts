import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const ROUTES: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/Home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('./views/home/index.vue'),
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('./views/contact/index.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: ROUTES,
});

export default router;
