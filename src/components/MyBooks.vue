<template>
  <div>
    <app-book-grid :books="bookStore.books" :type="'remove'"></app-book-grid>
    <router-link class="btn btn-success" to="/add-book" tag="button">Add a Book</router-link>
  </div>
</template>

<script>
import BookGrid from '@/components/BookGrid'
import bookStore from '@/bookStore'
import userStore from '@/userStore'
import router from '@/router/index'
import { getBooks$ } from '@/http-request'

export default {
  name: 'my-books',
  components: {
    'app-book-grid': BookGrid
  },
  data () {
    return {
      bookStore: bookStore.store
    }
  },
  methods: {
    addBook () {
      router.push('add-book')
    },
    myTrades () {
      router.push('my-trades')
    }
  },
  beforeMount () {
    getBooks$(userStore.user.username, 1)
    .then(res => {
      this.loading = false
      bookStore.fillBookStore(res.data)
    })
    .catch(err => {
      this.loading = false
      const error = err.response.data
      console.error(error)
    })
  }
}
</script>

<style scoped>
</style>
