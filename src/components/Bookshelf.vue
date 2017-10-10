<template>
  <div>
    <nav class="nav nav-pills nav-fill">
      <router-link class="nav-item nav-link fake-pointer" active-class="active" to="/bookshelf/books" tag="li" replace>
        My Books
      </router-link>
      <router-link class="nav-item nav-link fake-pointer" active-class="active" to="/bookshelf/trades" tag="li" replace>
        My Trades
      </router-link>
    </nav>
    <hr />
    <router-view></router-view>
  </div>
</template>

<script>
import MyBooks from '@/components/MyBooks'
import MyTrades from '@/components/MyTrades'

export default {
  name: 'bookshelf',
  components: {
    'app-my-books': MyBooks,
    'app-my-trades': MyTrades
  },
  data () {
    return {
      trades: false
    }
  }
}
</script>

<style scoped>
  .fake-pointer {
    cursor: pointer;
    user-select: none;
  }
</style>