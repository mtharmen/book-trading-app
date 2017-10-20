<template>
  <div>
    <app-loading v-if="loading"></app-loading>
    <div class="alert alert-danger text-center" v-if="error && !loading">
      <strong>Error:</strong> {{error}}
    </div>
    <div v-if="!loading && !error">
      <app-book-grid 
        v-if="bookStore.books.length"
        :books="bookStore.books"
        :type="'trade'">
      </app-book-grid>
    </div>
    <h1 class="text-center" v-if="!bookStore.books.length && !error">No Books</h1>
  </div>
</template>

<script>
import bookStore from '@/bookStore'
import BookGrid from '@/components/BookGrid'
import Loading from '@/components/Loading'
import { getBooks$ } from '@/http-request'
export default {
  name: 'home',
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
      this.loading = true
      getBooks$()
      .then(res => {
        this.loading = false
        bookStore.fillBookStore(res.data)
      })
      .catch(err => {
        this.loading = false
        this.error = err.message
      })
    }
  }
}
</script>

<style scoped>
</style>
