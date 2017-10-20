import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Profile from '@/components/Profile'
import AddBook from '@/components/AddBook'
import MyBooks from '@/components/MyBooks'
import MyTrades from '@/components/MyTrades'
import NewTrade from '@/components/NewTrade'
import userStore from '@/userStore'
import tradeStore from '@/tradeStore'

Vue.use(Router)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/add-book',
    name: 'add-book',
    component: AddBook,
    meta: { requireAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requireAuth: true }
  },
  {
    path: '/my-books',
    name: 'my-books',
    component: MyBooks,
    meta: { requireAuth: true }
  },
  {
    path: '/my-trades',
    name: 'my-trades',
    component: MyTrades,
    props: (route) => ({ tradeID: route.query.tradeID, ISBN: route.query.ISBN }),
    meta: { requireAuth: true }
  },
  {
    path: '/new-trade',
    name: 'new-trade',
    component: NewTrade,
    meta: { requireAuth: true, requireSetup: true }
  },
  {
    path: '*',
    redirect: '/'
  }
]

const router = new Router({
  mode: 'history',
  routes: routes
})

router.beforeEach((route, redirect, next) => {
  const requireAuth = route.matched.some(record => record.meta.requireAuth)
  const requireSetup = route.matched.some(record => record.meta.requireSetup)
  if (requireAuth) {
    if (userStore.checkToken()) {
      if (requireSetup) {
        if (tradeStore.store.newTrade.owner) {
          next()
        } else {
          next('/')
        }
      } else {
        next()
      }
      next()
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export default router
