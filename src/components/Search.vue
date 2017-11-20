<template>
  <div>
    <h1>Search</h1>
    <!-- TODO: make it so only title is shown by default with advanced showing the other options -->
    <form @submit.prevent="findBooks">
      <div class="input-group">
        <span class="input-group-addon">
          Title
        </span>
        <input type="text" class="form-control" :placeholder="previous.title" maxlength="50" v-model.trim="search.title">
      </div>
      
      <div class="input-group">
        <span class="input-group-addon">
          Author
        </span>
        <input type="text" class="form-control" :placeholder="previous.author" maxlength="50" v-model.trim="search.author">
      </div>

      <div class="input-group">
        <span class="input-group-addon">
          ISBN
        </span>
        <input type="text" name="isbn" class="form-control" :placeholder="previous.isbn" maxlength="50" v-model.trim="search.isbn">
      </div>
      <!-- v-validate="{ regex: /^[Xx0-9]+$/ }" <span v-show="errors.has('isbn')" class="small text-danger">ISBN must only contain numbers or 'X'</span> -->
      <button type="submit" class="btn btn-primary">Search</button>
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
      <div v-show="!searchResults.length && !pristine">No Books Found</div>
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
      search: {
        title: '',
        author: '',
        isbn: ''
      },
      previous: {
        title: 'Enter a title',
        author: 'Enter an author',
        isbn: 'Enter an ISBN'
      },
      submitting: false,
      error: '',
      bookStore: bookStore.store,
      searchResults: []
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
  computed: {
    pristine () {
      return this.previous.title === 'Enter a title' && this.previous.author === 'Enter an author' && this.previous.isbn === 'Enter an ISBN'
    }
  },
  methods: {
    getBooks () {
      getBooks$(userStore.user.username, 1)
        .then(res => {
          this.submitting = false
          bookStore.fillBookStore(res.data)
        })
        .catch(err => {
          this.submitting = false
          this.error = err.message
        })
    },
    findBooks () {
      this.submitting = true
      this.error = ''
      this.searchResults = []
      const search = {}
      Object.keys(this.search).forEach(key => {
        search[key] = this.search[key].replace(' ', '+')
      })
      searchBooks$(search)
      .then(res => {
        this.submitting = false
        this.clearSearch()
        this.searchResults = res.data
      })
      .catch(err => {
        this.submitting = false
        this.clearSearch()
        this.error = err.message
      })
    },
    clearSearch () {
      const defaults = {
        title: 'Enter a title',
        author: 'Enter an author',
        isbn: 'Enter an ISBN'
      }
      Object.keys(this.search).forEach(key => {
        this.previous[key] = this.search[key] ? this.search[key] : defaults[key] // this.previous[key]
        this.search[key] = ''
      })
    }
  }
}
</script>

<style scoped>
  .input-group-addon {
    min-width: 75px;
  }
</style>
