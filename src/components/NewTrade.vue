<template>
  <div>
    <div class="alert alert-danger text-center" v-if="error"><strong>Error:</strong> {{ error }}</div>
    <app-trade-card :username="user.username" :trade="trade" :books="store.books" @userChoice="checkBook" @detail="moreDetail" @submit="submit"></app-trade-card>
    <app-detail-modal ref="details" :type="'info'"></app-detail-modal>
  </div>
</template>

<script>
import DetailModal from '@/components/DetailModal'
import Loading from '@/components/Loading'
import TradeCard from '@/components/TradeCard'
import userStore from '@/userStore'
import tradeStore from '@/tradeStore'
import bookStore from '@/bookStore'
import router from '@/router/index'
import { getBooks$, makeTrade$ } from '@/http-request'

export default {
  name: 'new-trade',
  components: {
    'app-detail-modal': DetailModal,
    'loading': Loading,
    'app-trade-card': TradeCard
  },
  data () {
    return {
      store: bookStore.store,
      submitting: false,
      error: '',
      user: userStore.user,
      trade: {
        offer: { owner: userStore.user.username },
        request: tradeStore.store.newTrade
      }
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
      // NOTE: Since the only way to this page is from the front page, opting to prune the list of the books instead of fetching it
      //       This leaves out the user's books that are not available since they are in the middle of an accepted trade, but they can't use them anyway
      bookStore.pruneToUser(userStore.user.username)
      // Getting all books that the request owner has to cross reference with offer owner's books
      // and make sure the user doesn't offer a trade with a book that the request owner already owns
      getBooks$(this.trade.request.owner, 1, 1)
        .then(res => {
          this.compareBooks(res.data)
        })
        .catch(err => {
          this.error = err.message
        })
    },
    moreDetail (book) {
      this.$refs.details.showModal(book)
    },
    compareBooks (ISBNs) {
      this.store.books.forEach((book, i) => {
        if (ISBNs.indexOf(book.ISBN) > -1) {
          bookStore.changeBookStatus(i, 'invalid')
        }
      })
    },
    checkBook () {
      this.error = ''
      if (this.trade.offer.traded) {
        this.error = this.trade.request.owner + ' already owns this book'
      }
    },
    submit () {
      this.submitting = true
      this.error = ''
      const newTrade = {
        offer: {
          owner: this.trade.offer.owner,
          ISBN: this.trade.offer.ISBN,
          image: this.trade.offer.image
        },
        request: {
          owner: this.trade.request.owner,
          ISBN: this.trade.request.ISBN,
          image: this.trade.request.image
        }
      }
      makeTrade$(newTrade)
        .then(res => {
          this.submitting = false
          router.push('my-trades')
        })
        .catch(err => {
          this.submitting = false
          this.error = err.message
        })
    }
  },
  beforeDestroy () {
    tradeStore.clearNewTrade()
  }
}
</script>

<style scoped>
</style>
