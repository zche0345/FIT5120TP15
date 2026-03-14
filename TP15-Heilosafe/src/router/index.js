import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/HomePage.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: LoginPage, // temporary placeholder
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router