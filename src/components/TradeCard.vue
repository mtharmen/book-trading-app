<template>
  <div class="card text-center mb-2">
    <div class="card-header" :class="tradeStatus">
      <div class="row">
        <!-- TODO: Change to past tense for declined/accepted trades -->
        <div class="col-5">{{ offerText }} offering</div>
        <div class="col-2">for</div>
        <div class="col-5">{{ requestText }}</div>
      </div>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-5">
          <!-- NOTE: Couldn't get vue to accept a static local file for a default for some reason -->
          <img class="invalid" src="../assets/default-book.png" v-if="!trade.offer.image">
          <img :src="trade.offer.image" :class="{'invalid': !trade.status && trade.offer.traded} "@click="moreDetail('offer')" v-if="trade.offer.image">
          <div id="new-trade-input">
            <span v-if="books && !books.length">
              <p>You have no books to trade</p>
              <router-link to="/add-book">Click here to add a book to your library</router-link>
            </span>
            <select name="offer" class="form-control" id="offer" @change="userChoice" v-model="trade.offer" v-if="books && books.length">
              <option disabled :value="trade.offer">Please select a book to offer</option>
              <option v-for="(choice, i) in books" :key="i" :value="choice">{{ choice.title }}</option>
            </select>
          </div>
        </div>
        <div class="col-2 middle">
          <i class="fa fa-arrows-h" aria-hidden="true"></i>
        </div>
        <div class="col-5">
          <img :src="trade.request.image" @click="moreDetail('request')">
        </div>
      </div>
    </div>
    <div class="card-footer">
      <div class="pull-right" v-if="!trade.status">
        <span class="text-danger mr-auto" v-if="error">{{ error }}</span>
        <!-- NOTE: If error isn't changed into a boolean, vue seemingly doesn't recognize the change when drawing elements? -->
        <button class="btn btn-primary" :disabled="trade.offer.traded || !!error" @click="submit">Submit Trade</button>
      </div>
      <div v-if="trade.status">
        <!-- TODO: Clean this up -->
        <div v-if="trade.status !== 'pending'">
          {{ resultText }}
          <div v-if="trade.status === 'accepted'">
            <button class="btn btn-sm btn-info" @click="getAddress" v-if="!trade[mine].recieved">
              Get {{ trade.offer.owner === username ? trade.request.owner : trade.offer.owner }}'s mailing info
            </button>
            <!-- TODO: Clean up, figure out why the dom wont update -->
            <button class="btn btn-sm btn-success" @click="recieved" v-if="!trade[mine].recieved">The Book Arrived</button>
            <p v-if="trade[mine].recieved">You said you recieved the book on {{ Date(trade[mine].recieved).substring(0, 15) }}</p>
            <p>{{ trade[theirs].recieved ? 'They recieved the book on ' + Date(trade[theirs].recieved).substring(0, 15) : 'They have not recieved the book yet' }}</p>
          </div>
          <!-- <button class="btn btn-warning pull-right" @click="hideTrade">Hide Trade</button> -->
        </div>
        <span class="pull-right" v-if="trade.status === 'pending'">
          <button class="btn btn-danger" @click="decline" v-if="trade.offer.owner !== username">Decline</button>
          <button class="btn btn-success" @click="accept" v-if="trade.offer.owner !== username">Accept</button>
          <button class="btn btn-warning" @click="cancel" v-if="trade.offer.owner === username">Cancel</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '@/components/Loading'

export default {
  name: 'trade-card',
  components: {
    'loading': Loading
  },
  props: ['username', 'trade', 'books', 'error'],
  computed: {
    offerText () {
      return this.trade.offer.owner !== this.username ? this.trade.offer.owner + ' is ' : 'You are'
    },
    requestText () {
      return this.trade.request.owner !== this.username ? this.trade.request.owner + '\'s' : 'your'
    },
    resultText () {
      return this.trade.offer.owner === this.username
        ? (this.trade.request.owner + ' has ' + this.trade.status + ' this trade')
        : ('You have ' + this.trade.status + ' this trade')
    },
    tradeStatus () {
      return { 'bg-success': this.trade.status === 'accepted', 'bg-danger': this.trade.status === 'declined' }
    },
    mine () {
      return this.trade.offer.owner === this.username ? 'offer' : 'request'
    },
    theirs () {
      return this.trade.offer.owner === this.username ? 'request' : 'offer'
    }
  },
  methods: {
    moreDetail (type) {
      let owner = this.trade[type].owner
      // Flipping the owner since it's from a completed trade
      if (this.trade.offer.recieved && this.trade.request.recieved) {
        owner = type === 'offer' ? this.trade.request.owner : this.trade.offer.owner
      }
      const book = { owner, ISBN: this.trade[type].ISBN }
      this.$emit('detail', book)
    },
    cancel () {
      this.$emit('cancel', this.trade._id)
    },
    decline () {
      this.$emit('decline', this.trade._id)
    },
    accept () {
      this.$emit('accept', this.trade._id)
    },
    submit () {
      this.$emit('submit')
    },
    userChoice () {
      this.$emit('userChoice')
    },
    getAddress () {
      this.$emit('getAddress', this.trade._id)
    },
    recieved () {
      const response = confirm('Have you recieved your book?')
      let type = ''
      if (response) {
        if (this.trade.offer.owner === this.username) {
          type = 'offer'
        } else {
          type = 'request'
        }
        this.$emit('recieved', this.trade._id, type)
      }
    },
    hideTrade () {
      let type = ''
      if (this.trade.offer.owner === this.username) {
        type = 'offer'
      } else {
        type = 'request'
      }
      this.$emit('hideTrade', this.trade._id, type)
    }
  }
}
</script>

<style scoped>
  #new-trade-input {
    padding-top: 10px;
  }
  .middle {
    line-height: 195px;
    vertical-align: middle;
  }

  .invalid {
    opacity: 0.5
  }
</style>