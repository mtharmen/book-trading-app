var request = require('request-promise-native');
var fs      = require('fs');

var Book  = require('../config/models/book');
var Trade = require('../config/models/trade');

module.exports = function(app) {

	app.get('/api/allBooks/:user?', function(req, res, next) {

		var query = req.params.user ? { owner: req.params.user } : {};

		Book.find(query, function(err, books) {
			if (err) { return next(err); }
			res.json(books);
		});
	});

	app.post('/api/search', function(req, res, next) {
		var valid = /^[A-Za-z0-9\s\-_,\.;:()]+$/;

		if (!req.body.title.match(valid)) {
			var error = new TypeError('Invalid Characters used');
			return next(error);
		}

		var url = 'https://' + 'www.googleapis.com' + setParameters('/books/v1/volumes?q=', req.body.title);

		var options = {
		  uri: url,
		  method: 'GET',
		  headers: {
			  'User-Agent': 'Request-Promise'
		  },
		  json: true
		};
   
		request(options)
			.then(function(data) {
				var booksInfo = data.items;
				var maxBooks = data.totalItems <= 6 ? data.totalItems : 6;
				var bookList = [];
				// TODO: convert this .map?
				for (var i=0; i < maxBooks; i++) {
					var book = {};
					// If the book has an ISBN, add that book
					var ISBNs = booksInfo[i].volumeInfo.industryIdentifiers;
					var imageLink = booksInfo[i].volumeInfo.imageLinks;
					if (ISBNs && imageLink) {
						book.title       = booksInfo[i].volumeInfo.title;
						book.authors     = booksInfo[i].volumeInfo.authors;
						book.ISBN        = ISBNs[0].type == 'ISBN_10' ? ISBNs[0].identifier : ISBNs[1].identifier;
						book.image       = booksInfo[i].volumeInfo.imageLinks.thumbnail;
						// book.description = booksInfo[i].searchInfo ? booksInfo[i].searchInfo.textSnippet : 'No Description Available.'
						// book.description = booksInfo[i].volumeInfo.description ? booksInfo[i].volumeInfo.description : 'No Description Available.'
						bookList.push(book);
					} else if (booksInfo.length > maxBooks) {
						maxBooks += 1;
					}		
				}
				res.json(bookList);
			})
			.catch(function(err) { return next(err); });
	});

	// Doesn't work with Heroku since it spins up the server based on what's on GitHub
	app.post('/api/addBookOld', function(req, res, next) {

		console.log('Adding Book');

		var ISBN    = req.body.ISBN;
		var title   = req.body.title;
		var authors = req.body.authors;

		var path = './public/imgs/' + ISBN + '.png';

		// Checking if a copy already exists
		var imagePromise = new Promise(function(resolve, reject) {
			if (!fs.existsSync(path)) { 
				// saving local copy of image instead of constantly hotlinking in the future
				request(req.body.image)
					.pipe(fs.createWriteStream(path))
					.on('error', function(err) { reject(err); })
					.on('close', function() { 
						resolve('imgs/' + ISBN + '.png');
					});
			} else {
				resolve('imgs/' + ISBN + '.png');
			}
		});

		imagePromise
			.then(function(image) {
				var book = new Book({ 
					ISBN      : ISBN,
					title     : title,
					authors   : authors,
					image     : image,
					owner     : req.user.username,
					available : true
				});

				book.save(function(err){
					if (err) { return next(err); }
					console.log(title + ' saved.');
					res.json(book);
				});
			
			})
			.catch(function(err) {
				return next(err);
			});

	});

	app.post('/api/addBook', function(req, res, next) {

		console.log('Adding Book');

		var book = new Book({ 
			ISBN      : req.body.ISBN,
			title     : req.body.title,
			authors   : req.body.authors,
			image     : req.body.image,
			owner     : req.user.username,
			available : true
		});

		book.save(function(err){
			if (err) { return next(err); }
			console.log(req.body.title + ' saved.');
			res.json(book);
		});
	});

	app.post('/api/removeBook', function(req, res, next) {
		var id = req.body._id;

		// Removing all trades associated with the book
		Book.findOneAndRemove({_id: id}, function(err, book) {
			if (err) { return next(err); }
			var query = { 
				$or: [
					{ offer  : { owner: book.owner, ISBN: book.ISBN } }, 
					{ request: { owner: book.owner, ISBN: book.ISBN } }
				]
			};

			Trade.remove(query, function(err) {
				if (err) { return next(err); }

				res.send('removed');
			});

		});
	});

	app.post('/api/getBook', function(req, res, next) {
		var owner = req.body.owner;
		var ISBN = req.body.ISBN;

		Book.findOne({ owner: owner, ISBN: ISBN }, function(err, book) {
			if (err) { return next(err); }
			res.json(book);
		});
	});

	app.post('/api/newTrade', function(req, res, next) {
		var tradeRequest = req.body;
		tradeRequest.showOffer = true;
		// tradeRequest.status = 'pending'

		Trade.findOne(tradeRequest, function(err, trade) {
			if (err) { return next(err); }

			if (trade) { 
				console.error('Trade already exists');
				res.status(400).send('Trade already exists') ;
			}

			else { 
				console.log('Creating new Trade');
				tradeRequest.status = 'pending';
				tradeRequest.createDate = new Date();
				tradeRequest.showRequest = true;
				newTrade = new Trade(tradeRequest);

				newTrade.save(function(err, trade) {
					if (err) { return next(err); }
					console.log('Request ' + newTrade._id + ' saved.');
					res.send('Trade created');
				});
			}
		});
  });

	app.post('/api/getTrades', function(req, res, next) {
		var query = defineQuery(req.body.type, req.user.username, req.body.ISBN);

		Trade.find(query, function(err, trades) {
			if (err) { return next(err); }
			res.json(trades);
		});
	});

	app.post('/api/respondToTrade', function(req, res, next) {
		var id = req.body.id;

		Trade.findOne({ _id: id }, function(err, trade) {
			if (err) { return next(err); }

			if (!trade) {
				console.log('Trade ' + id + ' does not exist or was deleted');
				res.status(400).send('Trade ' + id + ' does not exist or was deleted');
			} else {
				trade.status       = req.body.accept ? 'accepted' : 'rejected';
				trade.responseDate = new Date();

				var promises = [];
				// If the trade is 'accepted', change all 'pending' trades associated to both books to 'rejected'
				if (trade.status === 'accepted') {
					var owner1 = trade.offer.owner;
					var book1  = trade.offer.ISBN;
					var owner2 = trade.request.owner;
					var book2  = trade.request.ISBN;
					var query = {
						$or  : [
							{ offer   : { owner: owner1, ISBN: book1 } },
							{ offer   : { owner: owner2, ISBN: book2 } },
							{ request : { owner: owner1, ISBN: book1 } },
							{ request : { owner: owner2, ISBN: book2 } },
						],
						// exclude current trade
						_id   : { $ne: trade._id },
						status: 'pending'
					};
					promises.push(Trade.update(query, {status: 'rejected'}).exec());

					// TODO: Switch the owners of the books?
					// promises.push(Book.findOneAndUpdate({owner: trade.offer.owner, ISBN: trade.offer.ISBN}, {owner: trade.request.owner}).exec())
					// Problem?: After switching the first book, the second person might own two copies of the same book
					// promises.push(Book.findOneAndUpdate({owner: trade.request.owner, ISBN: trade.request.ISBN}, {owner: trade.offer.owner}).exec())
				}
				promises.push(trade.save());
				
				Promise.all(promises)
					.then(function(data) {
						res.send('Trade updated');
					})
					.catch(function(err) {
						return next(err);
					});
			}
		});
	});

	app.post('/api/removeTrade', function(req, res, next) {
		var id = req.body.id;

		Trade.remove({ _id: id }, function(err) {
			if (err) { return next(err); }

			console.log('Trade ' + id + ' removed.');
			res.send('offer removed');
		});
	});

	app.post('/api/hideTrade', function(req, res, next) {
		var id   = req.body.id;
		var type = req.body.type;

		Trade.findOne({ _id: id }, function(err, trade) {
			if (err) { return next(err); }

			if (!trade) {
				console.log('Trade ' + id + ' does not exist or was deleted');
				res.status(400).send('Trade ' + id + ' does not exist or was deleted');
			} else {
				if (type === 'offer') { 
					trade.showOffer = false;
				}
				else if (type === 'request') { 
					trade.showRequest = false;
				}
				
				if (false) { // trade.showOffer === trade.showRequest) {
					// Both users are hiding the trade, so just remove it
					Trade.remove({ _id: id }, function(err) {
						if (err) { return next(err); }
						res.send('trade hidden');
					});
				} else {
					trade.save(function(err) {
						if (err) { return next(err); }
						res.send('trade hidden');
					});
				}
				
			}
		});
	});
};

var setParameters = function(base, terms, isbn, author) {

	var parameters = terms.replace(' ', '+').toLowerCase();
	parameters += isbn ? '+isbn:' + isbn : '';
	parameters += author ? '+inauthor:' + author.replace(' ', '+').toLowerCase() : '';

	return base + parameters;
};

var defineQuery = function(type, user, ISBN) {
	var query = {};
	if (type === 'offer') {
		query.showOffer = true;
		if (user) {
			query['offer.owner'] = user;
		} else if (ISBN) {
			query['offer.ISBN']  = ISBN;
		} else {
			return 'invalid';
		}
	} else if (type === 'request') {
		// query.status = 'pending' // filter out completed trades
		query.showRequest = true;
		if (user) {
			query['request.owner'] = user;
		} else if (ISBN) {
			query['request.ISBN']  = ISBN;
		} else {
			return 'invalid';
		}
	} else {
		return 'invalid';
	}
	return query;
};
