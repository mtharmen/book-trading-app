export default {
  store: {
    trades: {
      offers: [],
      requests: []
    },
    newTrade: {}
  },
  fillOffers (offers) {
    this.store.trades.offers = offers
  },
  fillRequests (requests) {
    this.store.trades.requests = requests
  },
  addOffer (offer) {
    this.store.trades.offers.push(offer)
  },
  addRequest (request) {
    this.store.trades.requests.push(request)
  },
  clearOffers () {
    this.store.trades.offers = []
  },
  clearRequests () {
    this.store.trades.requests = []
  },
  removeOffer (_id) {
    this.store.trades.offers = this.store.trades.offers.filter(offer => offer._id !== _id)
  },
  removeRequest (_id) {
    this.store.trades.requests = this.store.trades.requests.filter(request => request._id !== _id)
  },
  // TODO: change so it doesn't mutate directly?
  recievedBook (_id, type) {
    this.store.trades[type + 's'].forEach(trade => {
      if (trade._id === _id) {
        trade[type].recieved = true
      }
    })
  },
  // TODO: change so it doesn't mutate directly?
  updateTrade (_id, status) {
    this.store.trades.requests.forEach(trade => {
      if (trade._id === _id) {
        trade.status = status
      }
    })
  },
  setNewTrade (bookRequest) {
    this.store.newTrade = bookRequest
  },
  clearNewTrade () {
    this.store.newTrade = {}
  }
}
