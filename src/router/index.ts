import { createRouter, createWebHistory } from 'vue-router'
import Dome from "@/views/dome/index.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dome',
      component: Dome
    },
  ]
})

export default router
