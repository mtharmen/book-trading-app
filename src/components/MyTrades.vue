<template>
  <div>
    <ul class="nav nav-pills nav-fill">
      <li class="nav-item fake-pointer" @click="outgoingTab = false">
        <a class="nav-link" :class="{ 'active': !outgoingTab }">Incoming</a>
      </li>
      <li class="nav-item fake-pointer" @click="outgoingTab = true">
        <a class="nav-link" :class="{ 'active': outgoingTab }">Outgoing</a>
      </li>
    </ul>
    <hr />
    <div class="alert alert-danger text-center" v-if="error"><strong>Error:</strong> {{error}}</div>
    <!-- TODO: Figure out why the dropdown alignment breaks when there are no visible trades -->
    <b-dropdown id="ddown2" :text="'Showing ' + choice + ' Trades'" variant="info" class="m-md-2">
      <b-dropdown-item @click="choice = 'Pending'">Pending</b-dropdown-item>
      <b-dropdown-item @click="choice = 'Accepted'">Accepted</b-dropdown-item>
      <b-dropdown-item @click="choice = 'Declined'">Declined</b-dropdown-item>
      <b-dropdown-item @click="choice = 'All'">All</b-dropdown-item>
    </b-dropdown>
    <!-- TODO: split off tabs into their own components? -->
    <div class="trade-list" v-if="!outgoingTab">
      <div v-if="filteredTrades.incoming.length">
        <template v-for="(trade, i) in filteredTrades.incoming">
          <app-trade-card 
            :username="user.username"
            :trade="trade"
            @decline="decline"
            @accept="accept"
            @detail="moreDetail"
            @getAddress="getAddress"
            @recieved="recieved"
            :key="'i' + i"></app-trade-card>
        </template>
      </div>
      <h2 v-if="!filteredTrades.incoming.length">You have no {{ choice !== 'All' ? choice.toLowerCase() : '' }} incoming trades</h2>
    </div>
    <div class="trade-list" v-if="outgoingTab">
      <div v-if="filteredTrades.outgoing.length">
        <template v-for="(trade, i) in filteredTrades.outgoing">
          <app-trade-card 
            :username="user.username"
            :trade="trade"
            @cancel="cancel"
            @detail="moreDetail"
            @getAddress="getAddress"
            @recieved="recieved"
            :key="'o' + i"></app-trade-card>
        </template>
      </div>
      <h2 v-if="!filteredTrades.outgoing.length">You have no {{ choice !== 'All' ? choice.toLowerCase() : '' }} outgoing trades</h2>
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
      choice: 'All',
      outgoingTab: false,
      allTrades: false
    }
  },
  created () {
    this.getTrades('offer')
    this.getTrades('request')
  },
  watch: {
    '$route': function () {
      this.getTrades('offer')
      this.getTrades('request')
    }
  },
  computed: {
    filteredTrades () {
      const trades = {
        offers: [],
        requests: []
      }
      trades.outgoing = this.filterOut(this.trades.outgoing)
      trades.incoming = this.filterOut(this.trades.incoming)
      return trades
    }
  },
  methods: {
    getTrades (type) {
      this.submitting = true
      const fillType = type === 'offer' ? 'fillOutgoing' : 'fillIncoming'
      getTrades$(type, this.ISBN, this.tradeID)
        .then(res => {
          this.submitting = false
          tradeStore[fillType](res.data)
        })
        .catch(err => {
          this.submitting = false
          this.error = err.message
        })
    },
    moreDetail (book) {
      this.error = ''
      getBook$(book.owner, book.ISBN)
        .then(res => {
          this.$refs.details.showModal(res.data)
        })
        .catch(err => {
          this.error = err.message
        })
    },
    filterOut (trades) {
      const types = ['pending', 'declined', 'accepted']
      let valid = ''
      if (this.choice !== 'All') {
        valid = [this.choice.toLowerCase()]
      } else {
        valid = types
      }
      return trades.filter(trade => {
        return valid.indexOf(trade.status) > -1
      })
    },
    cancel (id) {
      this.submtting = true
      tradeStore.setError(id, undefined)
      removeTrade$(id)
        .then(res => {
          this.submitting = false
          tradeStore.removeOutgoing(id)
        })
        .catch(err => {
          this.submitting = false
          tradeStore.setError(id, err.message)
        })
    },
    decline (id) {
      this.respond(id, 'declined')
    },
    accept (id) {
      this.respond(id, 'accepted')
    },
    respond (id, tradeResponse) {
      this.submitting = true
      tradeStore.setError(id, undefined)
      respondToTrade$(id, tradeResponse)
        .then(res => {
          if (tradeResponse === 'declined') {
            this.submitting = false
            tradeStore.updateTrade(id, tradeResponse)
          } else {
            this.getTrades('offer')
            this.getTrades('request')
          }
        })
        .catch(err => {
          this.submitting = false
          tradeStore.setError(id, err.message)
        })
    },
    getAddress (id) {
      getAddress$(id)
        .then(res => {
          this.$refs.mailing.showModal(res.data)
        })
        .catch(err => {
          this.error = err.message
        })
    },
    recieved (id, type) {
      this.submitting = true
      completeTrade$(id)
        .then(res => {
          this.submitting = false
          tradeStore.recievedBook(id, type)
        })
        .catch(err => {
          this.submitting = false
          this.error = err.message
        })
    },
    fetchData () {
      this.getTrades('offer')
      this.getTrades('request')
    }
  }
}
</script>

<style scoped>
  .fake-pointer {
    cursor: pointer;
    user-select: none;
  }

  .trade-list {
    overflow-y: auto
  }
</style>
