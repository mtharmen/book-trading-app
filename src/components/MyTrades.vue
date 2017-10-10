<template>
  <div>
    <!-- TODO: Include option to show trades that include a certain book
               and add a link from the detail modal of that book? -->
    <ul class="nav nav-pills nav-fill">
      <li class="nav-item fake-pointer" @click="requestTab = false">
        <a class="nav-link" :class="{ 'active': !requestTab }">Offers</a>
      </li>
      <li class="nav-item fake-pointer" @click="requestTab = true">
        <a class="nav-link" :class="{ 'active': requestTab }">Requests</a>
      </li>
    </ul>
    <hr />
    <!-- TODO: Change to drop down and support pending/accepted/declined -->
    <button class="btn btn-primary" @click="onlyPending = !onlyPending">{{ onlyPending ? ' Show All' : 'Show Only Pending' }} Trades</button>
    <!-- <button class="btn btn-primary" @click="showAll">Show All Trades</button> -->
    <div v-if="!requestTab">
      <div v-if="filteredTrades.offers.length">
        <template v-for="(offer, i) in filteredTrades.offers">
          <app-trade-card 
            :username="user.username"
            :trade="offer"
            :error="error"
            @cancel="cancel"
            @detail="moreDetail"
            @getAddress="getAddress"
            @recieved="recieved"
            :key="'r' + i"></app-trade-card>
        </template>
      </div>
      <h2 v-if="!filteredTrades.offers.length">You have no offers</h2>
    </div>
    <div v-if="requestTab">
      <div v-if="filteredTrades.requests.length">
        <template v-for="(request, i) in filteredTrades.requests">
          <app-trade-card 
            :username="user.username" 
            :trade="request" 
            :error="error" 
            @decline="decline" 
            @accept="accept" 
            @detail="moreDetail" 
            @getAddress="getAddress"
            @recieved="recieved"
            :key="'r' + i"></app-trade-card>
        </template>
      </div>
      <h2 v-if="!filteredTrades.requests.length">You have no requests</h2>
    </div>
    <app-detail-modal ref="details" :type="'info'"></app-detail-modal>
    <app-mailing-modal ref="mailing"></app-mailing-modal>
  </div>
</template>

<script>
import TradeCard from '@/components/TradeCard'
import Loading from '@/components/Loading'
import DetailModal from '@/components/DetailModal'
import MailingModal from '@/components/MailingModal'
import userStore from '@/userStore'
import tradeStore from '@/tradeStore'
import { getTrades$, respondToTrade$, removeTrade$, getBook$, getAddress$, completeTrade$ } from '@/http-request'

export default {
  name: 'my-trades',
  components: {
    'app-trade-card': TradeCard,
    'app-loading': Loading,
    'app-detail-modal': DetailModal,
    'app-mailing-modal': MailingModal
  },
  props: ['tradeID', 'ISBN'],
  data () {
    return {
      submitting: false,
      error: '',
      user: userStore.user,
      trades: tradeStore.store.trades,
      onlyPending: false,
      requestTab: false,
      allTrades: false
    }
  },
  computed: {
    filteredOffers () {
      return this.trades.offers.filter(offer => {
        let pass = true
        if (this.onlyPending) {
          pass = offer.status === 'pending'
        }
        return pass
      })
    },
    filteredRequests () {
      return this.trades.requests.filter(request => {
        let pass = true
        if (this.onlyPending) {
          pass = request.status === 'pending'
        }
        return pass
      })
    },
    filteredTrades () {
      const trades = {
        offers: [],
        requests: []
      }
      trades.offers = this.filterOut(this.trades.offers)
      trades.requests = this.filterOut(this.trades.requests)
      return trades
    }
  },
  methods: {
    getTrades (type) {
      const fillType = type === 'offer' ? 'fillOffers' : 'fillRequests'
      getTrades$(type, this.ISBN, this.tradeID)
        .then(res => {
          tradeStore[fillType](res.data)
        })
        .catch(err => {
          const error = err.response ? err.response.data : 'Server is Busy'
          console.error(error)
        })
    },
    moreDetail (book) {
      getBook$(book.owner, book.ISBN)
        .then(res => {
          this.$refs.details.showModal(res.data)
        })
        .catch(err => {
          const error = err.response ? err.response.data : 'Server is Busy'
          console.error(error)
        })
    },
    filterOut (trades) {
      return trades.filter(trade => {
        if (this.onlyPending) {
          return trade.stauts === 'pending'
        }
        return true
      })
    },
    cancel (id) {
      removeTrade$(id)
        .then(res => {
          tradeStore.removeOffer(id)
        })
        .catch(err => {
          const error = err.response ? err.response.data : 'Server is Busy'
          console.error(error)
          this.error = error.message
        })
    },
    decline (id) {
      this.respond(id, 'declined')
    },
    accept (id) {
      this.respond(id, 'accepted')
    },
    respond (id, tradeResponse) {
      respondToTrade$(id, tradeResponse)
        .then(res => {
          if (tradeResponse === 'declined') {
            tradeStore.updateTrade(id, tradeResponse)
          } else {
            this.getTrades('offer')
            this.getTrades('request')
          }
        })
        .catch(err => {
          const error = err.response ? err.response.data : 'Server is Busy'
          console.error(error)
          this.error = error.message
        })
    },
    getAddress (id) {
      getAddress$(id)
        .then(res => {
          this.$refs.mailing.showModal(res.data)
        })
        .catch(err => {
          const error = err.response ? err.response.data : 'Server is Busy'
          console.error(error)
          this.error = error
        })
    },
    recieved (id, type) {
      completeTrade$(id)
        .then(res => {
          tradeStore.recievedBook(id, type)
        })
        .catch(err => {
          console.error(err)
        })
    },
    showAll () {
      // Check if already have all trades
      // if allTrades, just flip seperate variable for filter
      // if not allTrades, call server
        // this.submitting = true
        // get all trades
      console.log('getting all trades')
    }
  },
  beforeMount () {
    this.getTrades('offer')
    this.getTrades('request')
  }
}
</script>

<style scoped>
  .fake-pointer {
    cursor: pointer;
    user-select: none;
  }
</style>
