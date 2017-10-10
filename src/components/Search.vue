<template>
  <div>
    <h1>Add a Book</h1>
    <!-- TODO: add search by ISBN and author options -->
    <form class="input-group" @submit.prevent="findBooks">
      <input type="text" class="form-control" :placeholder="previous" maxlength="50" v-model="search">
      <span class="input-group-btn">
        <button class="btn btn-primary" type="submit">Search</button>
      </span>
    </form>
    <br />
    <app-loading v-show="submitting"></app-loading>
    <div class="alert alert-danger text-center" v-show="error && !submitting">
      <strong>Error:</strong> {{error}}
    </div>
    <div v-show="!submitting && !error">
      <div v-show="searchResults.length">
        <app-book-grid :books="searchResults" :type="'add'"></app-book-grid>
      </div>
      <div v-show="!searchResults.length && previous !== 'Enter a title'">No Books Found</div>
    </div>
  </div>
</template>

<script>
import bookStore from '@/bookStore'
import userStore from '@/userStore'
import Loading from '@/components/Loading'
import BookGrid from '@/components/BookGrid'
import { searchBooks$, getBooks$ } from '@/http-request'

export default {
  name: 'search',
  components: {
    'app-loading': Loading,
    'app-book-grid': BookGrid
  },
  data () {
    return {
      search: '',
      previous: 'Enter a title',
      submitting: false,
      error: '',
      bookStore: bookStore.store,
      searchResults: []
    }
  },
  methods: {
    findBooks () {
      this.submitting = true
      this.searchResults = []
      searchBooks$(this.search.replace(' ', '+'))
      .then(res => {
        this.submitting = false
        this.previous = this.search
        this.search = ''
        this.searchResults = res.data
      })
      .catch(err => {
        this.submitting = false
        const error = err.response ? err.response.data : 'Server is busy'
        console.error(error)
        this.error = error.message
      })
    }
  },
  beforeMount () {
    // TODO: Change this so it only uses the ISBNs for comparison purposes
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
