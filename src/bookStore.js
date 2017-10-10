export default {
  store: {
    books: []
  },
  fillBookStore (books) {
    this.clearBooks()
    this.store.books = books
  },
  clearBooks () {
    this.store.books = []
  },
  addBook (book) {
    this.store.books.push(book)
  },
  removeBook (ISBN) {
    this.store.books = this.store.books.filter(book => book.ISBN !== ISBN)
  },
  compareBook (ISBN) {
    return this.store.books.some(book => book.ISBN === ISBN)
  },
  changeBookStatus (i, status) {
    this.store.books[i].traded = status
  },
  pruneToUser (user) {
    this.store.books = this.store.books.filter(book => book.owner === user)
  }
}
