import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/homepage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import AwarenessPage from '../pages/AwarenessPage.vue'
import ClothingGuidePage from '../pages/ClothingGuidePage.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
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
    path: '/signup',
    name: 'SignUp',
    component: SignUpPage,
  },
  {
    path: '/awareness',
    name: 'Awareness',
    component: AwarenessPage,
  },
  {
    path: '/clothing-guide',
    name: 'ClothingGuide',
    component: ClothingGuidePage,
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
