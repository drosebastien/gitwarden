import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import GitLabCallbackView from '@/views/GitLabCallbackView.vue'
import CreateRepositoriesView from '@/views/CreateRepositoriesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth/gitlab/callback',
      name: 'gitlab-callback',
      component: GitLabCallbackView,
    },
    {
      path: '/create',
      name: 'create',
      component: CreateRepositoriesView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) {
    return
  }

  const accessToken = sessionStorage.getItem('gitlab_access_token')

  if (!accessToken) {
    return {
      name: 'home',
    }
  }
})

export default router
