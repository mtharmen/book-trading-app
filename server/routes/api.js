const router = require('express').Router()
const request = require('request-promise-native')

const my = require('./../helper')
const CustomError = my.CustomError

const Book = require('./../models/book')
const Trade = require('./../models/trade')
const mongoose = require('mongoose')

router.get('/getBooks', my.verifyToken, (req, res, next) => {
  const username = req.query.username
  const onlyISBN = req.query.onlyISBN
  const allBooks = req.query.allBooks

  const query = {}
  const filter = onlyISBN ? 'ISBN -_id' : ''

  // TODO: This is unweidling, clean up somehow
  // Logged in users
  if (req.payload.username) {
    if (!allBooks) {
      query.traded = undefined
    // User is requesting all book info => valid if onlyISBN and/or for self
    } else if (!onlyISBN) {
      // Requesting books for not self
      if (username !== req.payload.username) {
        return next(new CustomError('Unauthorized users cannot access full book info for other users', 409))
      }
    }
    // User is requesting allBooks and only wants ISBNs and/or their own books
    // NOTE: This allows for authorized users to get list of all the book ISBNs, maybe prevent this?
    //       Though can do the same thing by manually checking if the user has the same book when making a trade
  // Not Logged in users
  } else {
    if (allBooks) {
      return next(new CustomError('Unauthorized users cannot access to full list of books', 401))
    }
    query.traded = undefined
  }

  if (username) {
    query.owner = username
  }

  Book.find(query, filter, (err, books) => {
    if (err) { return next(err) }
    if (onlyISBN) {
      books = books.map(book => book.ISBN)
    }
    res.json(books)
  })
})

// TODO: merge with getBooks?
router.get('/getBook', (req, res, next) => {
  const owner = req.query.owner
  const ISBN = req.query.ISBN
  console.log(owner, ISBN)

  if (!owner || !ISBN) {
    return next(new CustomError('Missing parameters', 400))
  }

  Book.findOne({ owner, ISBN }, (err, book) => {
    if (err) { return next(err) }
    res.json(book)
  })
})

router.get('/search/', (req, res, next) => {
  const valid = /^[A-Za-z0-9\s\-_,.:()]+$/

  if (!req.query.title.match(valid)) {
    return next(new CustomError('Invalid Characters used', 400))
  }

  // TODO: Add check to remove books already added to user's library?

  const url = 'https://' + 'www.googleapis.com' + setParameters('/books/v1/volumes?q=', req.query.title)
  const options = {
    uri: url,
    method: 'GET',
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  }
  request(options)
    .then(data => {
      const booksInfo = data.items
      let maxBooks = data.totalItems <= 6 ? data.totalItems : 6
      const bookList = []
      // TODO: convert this .map?
      for (let i = 0; i < maxBooks; i++) {
        const book = {}
        // If the book has an ISBN, add that book
        const ISBNs = booksInfo[i].volumeInfo.industryIdentifiers
        const imageLink = booksInfo[i].volumeInfo.imageLinks
        if (ISBNs && imageLink) {
          book.title = booksInfo[i].volumeInfo.title
          book.authors = booksInfo[i].volumeInfo.authors
          book.ISBN = ISBNs[0].type === 'ISBN_10' ? ISBNs[0].identifier : ISBNs[1].identifier
          book.image = booksInfo[i].volumeInfo.imageLinks.thumbnail
          // book.description = booksInfo[i].searchInfo ? booksInfo[i].searchInfo.textSnippet : 'No Description Available.'
          // book.description = booksInfo[i].volumeInfo.description ? booksInfo[i].volumeInfo.description : 'No Description Available.'
          bookList.push(book)
        } else if (booksInfo.length > maxBooks) {
          maxBooks += 1
        }
      }
      res.json(bookList)
    })
    .catch(err => {
      return next(err)
    })
})

router.post('/addBook', my.verifyToken, my.UserGuard, (req, res, next) => {
  if (!req.body.ISBN || !req.body.title || !req.body.authors || !req.body.image) {
    return next(new CustomError('Missing new book parameters', 409))
  }
  const book = new Book()
  book.ISBN = req.body.ISBN
  book.title = req.body.title
  book.authors = req.body.authors
  book.image = req.body.image
  book.owner = req.user.username

  book.save(err => {
    if (err) { return next(err) }
    // console.log(req.body.title + ' saved.')
    res.json(book)
  })
})

router.delete('/removeBook/:id', my.verifyToken, my.UserGuard, (req, res, next) => {
  const _id = req.params.id

  // Removing all trades associated with the book
  Book.findById(_id).exec()
    .then(book => {
      if (book.owner !== req.user.username) {
        throw new CustomError('User does not own this book', 401)
      }
      req.query = {
        $or: [
          { offer: { owner: book.owner, ISBN: book.ISBN } },
          { request: { owner: book.owner, ISBN: book.ISBN } }
        ]
      }
      return Book.findByIdAndRemove(_id).exec()
    })
    .then(book => {
      return Trade.remove(req.query).exec()
    })
    .then(result => {
      res.send('removed')
    })
    .catch(err => {
      return next(err)
    })
})

router.put('/makeTrade', my.verifyToken, my.UserGuard, (req, res, next) => {
  const tradeInfo = req.body.tradeInfo
  if (!tradeInfo.offer || !tradeInfo.request ||
      !tradeInfo.offer.owner || !tradeInfo.offer.ISBN || !tradeInfo.offer.image ||
      !tradeInfo.request.owner || !tradeInfo.request.ISBN || !tradeInfo.request.image) {
    return next(new CustomError('Invalid trade request format', 400))
  }
  const newTrade = new Trade({
    offer: {
      owner: tradeInfo.offer.owner,
      ISBN: tradeInfo.offer.ISBN,
      image: tradeInfo.offer.image
    },
    request: {
      owner: tradeInfo.request.owner,
      ISBN: tradeInfo.request.ISBN,
      image: tradeInfo.request.image
    }
  })
  // Checking if the trade already exists
  const tradeCheck = {
    '$or': [
      newTrade,
      { offer: newTrade.request, request: newTrade.offer }
    ],
    status: 'pending'
  }

  Trade.findOne(tradeCheck).exec()
    .then(trade => {
      if (trade) {
        throw new CustomError('You have a pending trade with these books', 409)
      }
      // Checking if the books are available
      const bookCheck = {
        '$or': [
          {
            owner: newTrade.offer.owner,
            ISBN: newTrade.offer.ISBN,
            traded: undefined
          },
          {
            owner: newTrade.request.owner,
            ISBN: newTrade.request.ISBN,
            traded: undefined
          }
        ]
      }
      return Book.find(bookCheck).exec()
    })
    .then(books => {
      if (books.length < 2) {
        // TODO: Make more specific?
        throw new CustomError('Invalid Trade Request: Book(s) not available', 409)
      }
      newTrade.createDate = new Date()
      return newTrade.save()
    })
    .then(saved => {
      // console.log('Request ' + newTrade._id + ' saved.')
      res.send('Trade created')
    })
    .catch(err => {
      return next(err)
    })
})

router.get('/getTrades', my.verifyToken, my.UserGuard, (req, res, next) => {
  const allTrades = !!req.query.allTrades
  const ISBN = req.query.ISBN
  const type = req.query.type
  const tradeID = req.query.tradeID
  if (type !== 'offer' && type !== 'request') {
    return next(new CustomError('Invalid Type', 409))
  }

  const query = {}
  if (tradeID) {
    if (!mongoose.Types.ObjectId.isValid(tradeID)) {
      return next(new CustomError('Invalid tradeID', 400))
    }
    query._id = tradeID
  } else {
    query[type + '.owner'] = req.user.username
    if (!allTrades) {
      query[type + '.hide'] = undefined
    }
    if (ISBN) {
      query[type + '.ISBN'] = ISBN
    }
  }
  // const query = defineQuery(req.body.type, req.user.username, req.body.ISBN)

  Trade.find(query, (err, trades) => {
    if (err) { return next(err) }
    res.json(trades)
  })
})

router.get('/newTrades', my.verifyToken, my.UserGuard, (req, res, next) => {
  const query = {
    username: req.user.username,
    'offer.viewed': false,
    'request.viewed': false
  }
  // const filter = 'offer.owner request.owner -_id'
  Trade.find(query, (err, trades) => {
    if (err) { return next(err) }
    let offerNum = 0
    let requestNum = 0
    trades.forEach(trade => {
      if (trade.offer.owner === req.user.username) {
        offerNum++
      }
      if (trade.request.owner === req.user.username) {
        requestNum++
      }
    })
    res.json({ offerNum, requestNum })
  })
})

router.put('/respondToTrade/:id', my.verifyToken, my.UserGuard, (req, res, next) => {
  const tradeID = req.params.id
  const tradeResponse = req.body.response

  Trade.findById(tradeID).exec()
    .then(trade => {
      if (!trade) {
        throw new CustomError('Trade does not exist or was deleted', 404)
      }
      if (req.user.username !== trade.request.owner) {
        throw new CustomError('User is not part of trade', 401)
      }
      trade.status = tradeResponse
      // trade.responseDate = new Date()

      if (trade.status === 'accepted') {
        const owner1 = trade.offer.owner
        const book1 = trade.offer.ISBN
        const owner2 = trade.request.owner
        const book2 = trade.request.ISBN
        // query for declining all trades associated with books
        req.tradeQuery = {
          '$or': [
            { 'offer.owner': owner1, 'offer.ISBN': book1 },
            { 'offer.owner': owner2, 'offer.ISBN': book2 },
            { 'request.owner': owner1, 'request.ISBN': book1 },
            { 'request.owner': owner2, 'request.ISBN': book2 }
          ],
          // exclude current trade
          _id: { '$ne': trade._id },
          status: 'pending'
        }
        // query for setting both books to unavailable
        req.bookQuery = { $or: [
          { owner: owner1, ISBN: book1 },
          { owner: owner2, ISBN: book2 }
        ]}
      }
      return trade.save()
    })
    .then(trade => {
      if (req.tradeQuery) {
        // trade was accepted => declining all trades associated with books
        return Trade.update(req.tradeQuery, { status: 'declined' }).exec()
      }
    })
    .then(updated => {
      if (req.bookQuery) {
        // Making both books unavailable and associating them to the trade ID
        return Book.update(req.bookQuery, { traded: tradeID }, { 'multi': true }).exec()
      }
    })
    .then(updated => {
      res.send('updated')
    })
    .catch(err => {
      return next(err)
    })
})

router.delete('/removeTrade/:id', my.verifyToken, my.UserGuard, (req, res, next) => {
  const _id = req.params.id

  Trade.findById(_id).exec()
    .then(trade => {
      if (!trade) {
        throw new CustomError('Trade does not exist or was deleted', 404)
      }
      if (req.user.username !== trade.offer.owner) {
        throw new CustomError('User is not part of trade', 403)
      }
      if (trade.status !== 'pending') {
        throw new CustomError('Cannot cancel completed trades', 409)
      }
      return Trade.findByIdAndRemove(_id).exec()
    })
    .then(removed => {
      res.send('offer cancelled')
    })
    .catch(err => {
      return next(err)
    })
})

router.put('/hideTrade/:id', my.verifyToken, my.UserGuard, (req, res, next) => {
  const _id = req.params.id
  const type = req.body.type

  Trade.findById(_id).exec()
    .then(trade => {
      if (!trade) {
        throw new CustomError('Trade does not exist or was deleted', 404)
      }

      if (trade.status === 'pending') {
        throw new CustomError('Cannot hide pending trades', 403)
      }
      if (req.user.username !== trade.request.owner && req.user.username !== trade.offer.owner) {
        throw new CustomError('User is not part of trade', 403)
      }
      if (type === 'offer') {
        trade.showOffer = false
      } else if (type === 'request') {
        trade.showRequest = false
      } else {
        throw new CustomError('Invalid Format', 401)
      }
      // both users hiding the trade => delete the trade
      // if (!trade.showOffer && !trade.showRequest && trade.status === 'declined') {
      //   req.deleted = true
      //   return Trade.remove({ _id }).exec()
      // }
      return trade.save()
    })
    .then(saved => {
      res.send('trade hidden')
    })
    .catch(err => {
      return next(err)
    })
})

const User = require('./../models/user')

router.get('/getAddress/:id', my.verifyToken, my.UserGuard, (req, res, next) => {
  const tradeID = req.params.id
  Trade.findById(tradeID).exec()
    .then(trade => {
      if (trade.status !== 'accepted') {
        throw new CustomError('User has not accepted the trade', 409)
      }
      if (trade.offer.owner === req.user.username) {
        return User.findOne({ username: trade.request.owner }).exec()
      } else if (trade.request.owner === req.user.username) {
        return User.findOne({ username: trade.offer.owner }).exec()
      } else {
        throw new CustomError('User not part of the trade', 401)
      }
    })
    .then(user => {
      res.json({ username: user.username, profile: user.profile })
    })
    .catch(err => {
      return next(err)
    })
})

router.put('/completeTrade/:id', my.verifyToken, my.UserGuard, (req, res, next) => {
  const tradeID = req.params.id
  Trade.findById(tradeID).exec()
    .then(trade => {
      if (trade.offer.owner === req.user.username) {
        trade.offer.recieved = Date.now()
      } else if (trade.request.owner === req.user.username) {
        trade.request.recieved = Date.now()
      } else {
        throw new CustomError('User is not part of the trade', 401)
      }
      // Both users have recieved their books
      if (trade.offer.recieved && trade.request.recieved) {
        req.switch = { $or: [
          { owner: trade.offer.owner, ISBN: trade.offer.ISBN },
          { owner: trade.request.owner, ISBN: trade.request.ISBN }
        ]}
      }
      return trade.save()
    })
    .then(saved => {
      if (req.switch) {
        return Book.find(req.switch).exec()
      }
    })
    .then(books => {
      if (req.switch) {
        const book1Owner = books[0].owner
        const book2Owner = books[1].owner
        books[0].owner = book2Owner
        books[0].traded = undefined
        books[1].owner = book1Owner
        books[1].traded = undefined

        books[0].save()
        books[1].save()
      }
      res.send('done')
    })
    .catch(err => {
      return next(err)
    })
})

function setParameters (base, terms, isbn, author) {
  let parameters = terms.replace(' ', '+').toLowerCase()
  parameters += isbn ? '+isbn:' + isbn : ''
  parameters += author ? '+inauthor:' + author.replace(' ', '+').toLowerCase() : ''

  return base + parameters
}

function defineQuery (type, user, ISBN) {
  const query = {}
  if (type === 'offer') {
    query.showOffer = true
    if (user) {
      query['offer.owner'] = user
    } else if (ISBN) {
      query['offer.ISBN'] = ISBN
    } else {
      return 'invalid'
    }
  } else if (type === 'request') {
    // query.status = 'pending' // filter out completed trades
    query.showRequest = true
    if (user) {
      query['request.owner'] = user
    } else if (ISBN) {
      query['request.ISBN'] = ISBN
    } else {
      return 'invalid'
    }
  } else {
    return 'invalid'
  }
  return query
}

router.get('/testing', (req, res) => {
  const owner1 = 'Test'
  const book1 = '0826215491'
  const owner2 = 'Admin'
  const book2 = '1466853441'

  // const tradeCheck = {
  //   '$or': [
  //     { offer: { '$in': [ { owner: owner1, ISBN: book1 }, { owner: owner2, ISBN: book2 } ] } },
  //     { request: { '$in': [ { owner: owner1, ISBN: book1 }, { owner: owner2, ISBN: book2 } ] } }
  //   ]
  // }

  const tradeCheck = {
    '$or': [
      { 'offer.owner': owner1, 'offer.ISBN': book1 },
      { 'offer.owner': owner2, 'offer.ISBN': book2 },
      { 'request.owner': owner1, 'request.ISBN': book1 },
      { 'request.owner': owner2, 'request.ISBN': book2 }
    ]
  }

  if (req.query.trade) {
    Trade.find(tradeCheck, (err, trades) => {
      if (err) {
        res.json(err)
      }
      console.log(trades)
      res.json(trades)
    })
  }

  const bookQuery = { '$or': [
    { owner: owner1, ISBN: book1 },
    { owner: owner2, ISBN: book2 }
  ]}

  if (req.query.book) {
    Book.find(bookQuery, (err, books) => {
      if (err) {
        res.json(err)
      }
      res.json(books)
    })
  }
})

module.exports = router
