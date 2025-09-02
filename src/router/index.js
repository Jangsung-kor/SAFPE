import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import EditorView from '@/views/EditorView.vue'
import ShareView from '@/views/ShareView.vue'

const routes = [
  {
    path: '/',
    redirect: '/editor',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
  },
  {
    path: '/editor',
    name: 'Editor',
    component: EditorView,
    meta: {
      requiresAuth: true,
    },
  },
  /*
  {
    path: '/editor/:id',
    name: 'EditorById',
    component: EditorView,
    meta: {
      requiresAuth: true,
    },
  },
  */
  {
    path: '/share/:id',
    name: 'Share',
    component: ShareView,
  },
]

const router = createRouter({
  //history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHistory(),
  routes,
})

// 네비게이션 가드
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 인증이 필요한 페이지에 접근하려는데
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 로그인이 안 되어 있으면 로그인 페이지로 리디렉션
    next({
      name: 'Login',
    })
  } else {
    // 그 외의 경우는 정상 진행
    next()
  }
})

export default router
