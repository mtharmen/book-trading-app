<template>
  <div id="app">
    <div id="wrapper">
      <app-header>
        <b-nav is-nav-bar slot="nav-items" class="ml-auto">
          <b-nav-item v-if="user.username" to="/profile"><i class="fa fa-user-circle-o" aria-hidden="true"></i> Profile</b-nav-item>
          <b-nav-item v-if="user.username" to="/my-books"><i class="fa fa-book" aria-hidden="true"></i> My Books</b-nav-item>
          <b-nav-item v-if="user.username" to="/my-trades"><i class="fa fa-arrows-h" aria-hidden="true"></i>
 My Trades</b-nav-item>
          <!-- <b-nav-item v-if="user.username" to="/add-book">Add Book</b-nav-item> -->
          <app-login-modal v-if="!user.username">
            <i class="fa fa-sign-in" aria-hidden="true"></i> Login
          </app-login-modal>
          <!-- <b-nav-item v-if="!user.username" to="/login">
            <i class="fa fa-sign-in" aria-hidden="true"></i> Login
          </b-nav-item> -->
          <b-nav-item v-if="user.username" @click="logout">
            <i class="fa fa-sign-out" aria-hidden="true"></i> Logout
          </b-nav-item>
        </b-nav>
      </app-header>
      <div id="content" class="container">
        <router-view></router-view>
      </div>
    </div>
    <app-footer>
      <small slot="footer-links">
        <a href="https://www.freecodecamp.com/challenges/manage-a-book-trading-club" target="_blank">FCC Book Trading App </a> | 
        <a href="https://github.com/mtharmen/book-trading-app" target="_blank">GitHub Repo <i class="fa fa-github" aria-hidden="true"></i></a> | 
        <a href="http://fontawesome.io/" target="_blank">Icons from Font Awesome <i class="fa fa-font-awesome" aria-hidden="true"></i></a> | 
        <a href="https://developers.google.com/books/docs/overview" target="_blank">Book Data from Google Books </a>
      </small>
    </app-footer>
  </div>
</template>

<script>
// import axios from 'axios'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoginModal from '@/components/LoginModal'
import userStore from '@/userStore'
import router from '@/router/index'

export default {
  name: 'app',
  components: {
    'app-header': Header,
    'app-footer': Footer,
    'app-login-modal': LoginModal
  },
  data () {
    return {
      user: userStore.user
    }
  },
  methods: {
    logout () {
      userStore.logout()
      router.push('/')
    }
  },
  beforeMount () {
    if (userStore.checkToken()) {
      userStore.setUserInfo()
    } else {
      userStore.removeLocalStorage()
    }
  }
}
</script>

<style>
  #wrapper {
      min-height: 100vh;
  }

  .navbar {
      margin-bottom: 20px;
  }

  #content {
      overflow: auto;
      padding-bottom: 50px;
  }

  .footer {
      text-align: center;
      position: relative;
      margin-top: -50px;
      height: 50px;
      clear: both;
      padding-top: 10px;
  }
  /* Fix for vue-bootstrap modals */
  .modal.show {
    display:block;
  }
</style>
