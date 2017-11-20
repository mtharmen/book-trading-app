<template>
  <div>
    <h1>My Books</h1>
    <app-loading v-if="loading"></app-loading>
    <div class="alert alert-danger text-center" v-if="error && !loading">
      <strong>Error:</strong> {{error}}
    </div>
    <div v-if="!loading && !error">
      <app-book-grid :books="bookStore.books" :type="'remove'"></app-book-grid>
    </div>
    <h1 class="text-center" v-if="!bookStore.books.length && !error">No Books</h1>
    <router-link class="btn btn-success" to="/add-book" tag="button">Add a Book</router-link>
  </div>
</template>

<script>
import BookGrid from '@/components/BookGrid'
import Loading from '@/components/Loading'
import bookStore from '@/bookStore'
import userStore from '@/userStore'
import router from '@/router/index'
import { getBooks$ } from '@/http-request'

export default {
  name: 'my-books',
  components: {
    'app-book-grid': BookGrid,
    'app-loading': Loading
  },
  data () {
    return {
      bookStore: bookStore.store,
      loading: false,
      error: ''
    }
  },
  created () {
    this.getBooks()
  },
  watch: {
    '$route': function () {
      this.getBooks()
    }
  },
  methods: {
    getBooks () {
      getBooks$(userStore.user.username, 1)
        .then(res => {
          this.loading = false
          bookStore.fillBookStore(res.data)
        })
        .catch(err => {
          this.loading = false
          this.error = err.message
        })
    },
    addBook () {
      router.push('add-book')
    },
    myTrades () {
      router.push('my-trades')
    }
  }
}
</script>

<style scoped>
</style>
