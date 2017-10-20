export default {
  store: {
    trades: {
      outgoing: [],
      incoming: []
    },
    newTrade: {}
  },
  fillOutgoing (trades) {
    this.store.trades.outgoing = trades
  },
  fillIncoming (trades) {
    this.store.trades.incoming = trades
  },
  addOutgoing (trade) {
    this.store.trades.outgoing.push(trade)
  },
  addRequest (trade) {
    this.store.trades.incoming.push(trade)
  },
  clearOutgoing () {
    this.store.trades.outgoing = []
  },
  clearIncoming () {
    this.store.trades.incoming = []
  },
  removeOutgoing (_id) {
    this.store.trades.outgoing = this.store.trades.outgoing.filter(trade => trade._id !== _id)
  },
  removeIncoming (_id) {
    this.store.trades.incoming = this.store.trades.incoming.filter(trade => trade._id !== _id)
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
    this.store.trades.incoming.forEach(trade => {
      if (trade._id === _id) {
        trade.status = status
      }
    })
  },
  // TODO: change so it doesn't mutate directly?
  setError (_id, error) {
    this.store.trades.incoming.forEach(trade => {
      if (trade._id === _id) {
        trade.error = error
      }
    })
  },
  setNewTrade (newTrade) {
    this.store.newTrade = newTrade
  },
  clearNewTrade () {
    this.store.newTrade = {}
  }
}
