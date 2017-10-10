import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Login from '@/components/Login'
import Profile from '@/components/Profile'
import AddBook from '@/components/AddBook'
import MyBooks from '@/components/MyBooks'
import MyTrades from '@/components/MyTrades'
import NewTrade from '@/components/NewTrade'
import userStore from '@/userStore'
import tradeStore from '@/tradeStore'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/add-book',
      name: 'add-book',
      component: AddBook,
      beforeEnter: (to, from, next) => {
        if (userStore.checkToken()) {
          next()
        } else {
          next('/')
        }
      }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile,
      beforeEnter: (to, from, next) => {
        if (userStore.checkToken()) {
          next()
        } else {
          userStore.logout()
          next('/')
        }
      }
    },
    {
      path: '/my-books',
      name: 'my-books',
      component: MyBooks,
      beforeEnter: (to, from, next) => {
        if (userStore.checkToken()) {
          next()
        } else {
          next('/')
        }
      }
    },
    {
      path: '/my-trades',
      name: 'my-trades',
      component: MyTrades,
      props: (route) => ({ tradeID: route.query.tradeID, ISBN: route.query.ISBN }),
      beforeEnter: (to, from, next) => {
        if (userStore.checkToken()) {
          next()
        } else {
          next('/')
        }
      }
    },
    {
      path: '/new-trade',
      name: 'new-trade',
      component: NewTrade,
      beforeEnter: (to, from, next) => {
        if (userStore.checkToken() && tradeStore.store.newTrade.owner) {
          next()
        } else {
          next('/')
        }
      }
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
