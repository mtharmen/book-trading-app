<template>
  <div>
    <slot></slot>
    <!-- Modal -->
    <b-modal id="detailModal" ref="detailModal" :hide-footer="type === 'info'" :title="book.title">
      <div class="media" v-if="book">
        <img class="d-flex mr-3" :src="book.image">
        <div class="media-body">
          <h6 class="card-subtitle mb-2">
            {{ book.authors.length > 1 ? 'Authors:' : 'Author:' }}
            <span class="text-muted">{{ book.authors.join(', ') }}</span>
          </h6>
          <h6 class="card-subtitle mb-2">
            ISBN: <span class="text-muted">{{ book.ISBN }}</span>
          </h6>
          <h6 class="card-subtitle mb-2" v-if="type === 'trade' || type === 'info'">
            Owner: <span class="text-muted">{{ book.owner }}</span>
          </h6>
          <button class="btn btn-info" @click="tradeLink" v-if="user.username === book.owner">View all trades with this book</button>
        </div>
      </div>
      <div slot="modal-footer" :class="{ 'w-100' : type === 'remove' }">
        <small v-if="added && type === 'trade'">You have this book in your library</small>
        <small v-if="!user.username && type === 'trade'">You need to be logged in to trade</small>
        <button class="btn btn-primary" v-if="type === 'trade'" :disabled="!user.username || added " @click="newTrade">Trade</button>
        <small v-if="added && type === 'add'">You have already added this book to your library</small>
        <button class="btn btn-success" v-if="type === 'add'" @click="add" :disabled="added">Add</button>

        <div v-if="type === 'remove'">
          <div class="input-group" v-if="!book.traded">
            <input type="text" class="form-control" placeholder="Enter the ISBN to confirm" v-model="confirm">
            <span class="input-group-btn">
              <button class="btn btn-danger" @click="remove" :disabled="confirm !== book.ISBN">Remove</button>
            </span>
          </div>
          <span class="text-center" v-if="book.traded">
            This book is part of an accepted trade.
            <router-link :to="'/my-trades?tradeID=' + book.traded">Click here to go to that trade.</router-link>
          </span>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
// import { detailEventBus } from '@/DetailEventBus'
import userStore from '@/userStore'
import bookStore from '@/bookStore'
import tradeStore from '@/tradeStore'
import router from '@/router/index'
import { addBook$, removeBook$ } from '@/http-request'

export default {
  name: 'detail-modal',
  props: ['type'],
  data () {
    return {
      book: '',
      confirm: '',
      user: userStore.user
    }
  },
  computed: {
    added () {
      return bookStore.store.books.some(book => book.owner === this.user.username && book.ISBN === this.book.ISBN)
    },
    title () {
      return this.book ? this.book.title : 'Untitled'
    }
  },
  methods: {
    showModal (book) {
      this.book = book
      this.$refs.detailModal.show()
    },
    newTrade () {
      tradeStore.setNewTrade(this.book)
      router.push('new-trade')
    },
    remove () {
      this.confirm = ''
      removeBook$(this.book._id)
        .then(res => {
          bookStore.removeBook(this.book.ISBN)
          this.close()
        })
        .catch(err => {
          const error = err.response.data
          // TODO: Temporary
          console.error(error)
          // window.location.href = 'http://localhost:8080/error?code=' + error.code
        })
    },
    add () {
      addBook$(this.book)
        .then(res => {
          bookStore.addBook(res.data)
          this.close()
        })
        .catch(err => {
          const error = err.response.data
          // TODO: Temporary
          console.error(error)
          // window.location.href = 'http://localhost:8080/error?code=' + error.code
        })
    },
    close () {
      if (!this.submitting) {
        this.$refs.detailModal.hide()
      }
    },
    tradeLink () {
      this.close()
      router.push('my-trades?ISBN=' + this.book.ISBN)
    }
  }
}
</script>

<style scoped>
</style>
