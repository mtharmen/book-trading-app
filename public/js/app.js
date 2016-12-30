var bookApp = angular.module('votingApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap']);

// ACCOUNT FACTORTY
bookApp.factory('accountFactory', ['$http', '$location', function($http, $location) {

  var storedUser = { user: undefined };

  return {
    fetchUser: function() {
      return $http.get('/auth/user');
    },

    getUser: storedUser,

    setUser: function(user) {
      storedUser.user = user;
    },

    localSignUp: function(user) {
      return $http.post('/auth/local-signup', user);
    },

    localSignIn: function(user) {
      return $http.post('/auth/local-login', user);
    },

    updateInfo: function(info) {
      return $http.post('/auth/update', info);
    },

    redirect: function(path) {
      $location.url(path);
    },

    logout: function(){
      storedUser.user = undefined;
      $http.get('/auth/logout').then(function(response) {
        return response.data;
      });
      $location.url('/');
    }
  };
}]);

// MODAL FACTORTY
bookApp.factory('modalFactory', ['$uibModal', function($uibModal) {
  
  return {
    login: function(scope) {
      
      var modalOptions = {
        animation: true,
        templateUrl: 'partials/login-form',
        controller: 'loginModalCtrl'
      };
      
      if (scope) {
        modalOptions.scope = scope;
      }
      
      return $uibModal.open(modalOptions);
    },

    bookDetails: function(user, bookInfo, type) {
      // type = info, add, remove
      var modalOptions = {
        animation: true,
        templateUrl: 'partials/book-details',
        controller: 'bookModalCtrl',
        resolve: {
          settings: function() {
            return {user: user, bookInfo: bookInfo, type: type};
          }
        }
      };
      
      return $uibModal.open(modalOptions);
    },
    
    confirm: function(dialog, choose) {

      var choice = '';
      if (choose) {
        choice += '<button class="btn btn-primary col-xs-6" ng-click="confirm()">Okay</button>';
        choice += '<button class="btn btn-danger col-xs-6" ng-click="cancel()">Cancel</button>';
      } else {
        choice = '<button class="btn btn-primary col-xs-6 col-xs-offset-3" ng-click="confirm()">Okay</button>';
      }

      var modalOptions = {
        animation: true,
        template: '<div class="row" id="confirm-modal" style="padding-bottom: 30px">' +
                    '<div class="col-xs-10 col-xs-offset-1">' +
                      '<h3 style="text-align: center">' + dialog + '</h3>' +
                      '<br />' +
                    '</div>' +
                    '<div class="col-xs-10 col-xs-offset-1">' +
                      choice +
                    '</div>' +
                  '</div>',
        controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            $scope.confirm = function () {
              $uibModalInstance.close('yes');
            };

            $scope.cancel = function () {
              $uibModalInstance.dismiss('cancel');
            };
        }]
      };
      
      return $uibModal.open(modalOptions);
    }
  };
}]);

// BOOK FACTORTY
bookApp.factory('bookFactory', ['$http', '$location', function($http, $location) {

  var pending = { book: null };

  return {    
    getBooks: function(user) {
      return $http.get('/api/allBooks/' + user);
    },

    search: function(query) {
      return $http.post('/api/search', query);
    },

    addBook: function(book) {
      return $http.post('/api/addBook', book);
    },

    removeBook: function(book) {
      return $http.post('/api/removeBook', book);
    },

    pendingTrade: function(book) {
      pending.book = book;
    },

    getPendingTrade: pending,

    newTrade: function(newTrade) {
      return $http.post('/api/newTrade', newTrade);
    },

    getTrades: function(type, user, ISBN) {
      return $http.post('/api/getTrades', {type: type, user: user, ISBN: ISBN});
    },

    respondToTrade: function(id, accept) {
      return $http.post('/api/respondToTrade', {id: id, accept: accept});
    },

    removeTrade: function(id) {
      return $http.post('/api/removeTrade', {id: id});
    },

    hideTrade: function(id, type) {
      return $http.post('/api/hideTrade', {id: id, type: type});
    },

    redirect: function(path) {
      $location.url(path);
    }
  };
}]);

// ROUTING ===============================================================
bookApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
    
    .when('/', {
      templateUrl : 'partials/home',
      controller  : 'homeCtrl'
    })
    .when('/profile', {
      templateUrl : 'partials/profile',
      controller  : 'userCtrl'
    }) 
    .when('/settings', {
      templateUrl : 'partials/settings',
      controller  : 'settingsCtrl'
    })
    .when('/my-books', {
      templateUrl : 'partials/my-books',
      controller  : 'myBooksCtrl'
    })
    .when('/my-trades', {
      templateUrl : 'partials/my-trades',
      controller  : 'myTradesCtrl'
    })
    .when('/new-trade', {
      templateUrl : 'partials/new-trade',
      controller  : 'newTradeCtrl',
      resolve     : {
        pending : function(bookFactory) {
          if (!bookFactory.getPendingTrade.book) {
            window.location = '/';
          } else {
            return bookFactory.getPendingTrade;
          }
        }
      }
    })   
    .when('/error', {
      templateUrl : 'partials/error',
      controller  : 'errorCtrl'
    })

    .otherwise({
      redirectTo: '/'
    });
    
    $locationProvider.html5Mode(true);
}]);

// CONTROLLERS ===========================================================
// NAV 
bookApp.controller('navCtrl', ['$scope', 'accountFactory', 'modalFactory', function($scope, accountFactory, modalFactory) {

  $scope.current = accountFactory.getUser;
   
  accountFactory.fetchUser().then(
    function successCB (response) {
      $scope.current.user = response.data;
      $scope.loaded = true;
    },
    function errorCB (response) {
      console.error(response.status + ':' + response.statusText);
      accountFactory.redirect('/error');
    });

  $scope.newUser = function() {
              
    var modalInstance = modalFactory.login($scope);

    modalInstance.result.then(
      function(user) {
        $scope.current.user = user;
        accountFactory.redirect('/');
      }, 
      function() {
      }
    );
  };

  $scope.logout = function() {
    var modalInstance = modalFactory.confirm('Logout?', true);
    
    modalInstance.result.then(
      function(response) {
        accountFactory.logout();
      }, 
      function() {
      }
    );
     
  };
  
}]);

// LOGIN MODAL
bookApp.controller('loginModalCtrl', ['$scope', '$uibModalInstance', '$http', 'accountFactory', function ($scope, $uibModalInstance, $http, accountFactory) {
  
  $scope.newUser = {};
  $scope.locations = [
    'Alberta', 
    'British Columbia', 
    'Manitoba', 
    'New Brunswick', 
    'Newfoundland and Labrador', 
    'Northwest Territories', 
    'Nova Scotia', 'Nunavut', 
    'Ontario', 
    'Prince Edward Island', 
    'Quebec', 
    'Saskatchewan', 
    'Yukon'
  ];

  $scope.atSymbol = '^[^@]*$';
  $scope.validEmail = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
  // $scope.validCharacters = "/^[a-z ,.'-]+$/i";
  $scope.validCharacters = "^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$";

  $scope.signUp = function(user) {
    $scope.errMsg = '';
    accountFactory.localSignUp(user).then(
      function successCB (response) {
        if (response.data.message) {
          $scope.errMsg = response.data.message;
        }
        if (response.data._id) {
          $uibModalInstance.close(response.data);       
        }
      },
      function errorCB (response) {
        console.error(response.status + ':' + response.statusText);
        accountFactory.redirect('/error');
    });
  };
  
  $scope.signIn = function(user) {
    $scope.errMsg = '';
    accountFactory.localSignIn(user).then(
      function successCB (response) {
        if (response.data.message) {
          $scope.errMsg = response.data.message;
        }
        if (response.data._id) {
          $uibModalInstance.close(response.data);
        }
      },
      function errorCB (response) {
        console.error(response.status + ':' + response.statusText);
        accountFactory.redirect('/error');
    });  
  };
  
  $scope.switch = function(newAccount) {
    $scope.newUser = {};
    $scope.loginForm.$setPristine();
    $scope.errMsg = '';
    $scope.newAccount = !newAccount;
  };
  
  $scope.confirm = function() {
    $uibModalInstance.close('yes');
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
  
}]);

// BOOK MODAL
bookApp.controller('bookModalCtrl', ['$scope', '$uibModalInstance', 'settings', function ($scope, $uibModalInstance, settings) {

  $scope.book   = settings.bookInfo;
  $scope.add    = settings.type === 'add'    ? true : null;
  $scope.remove = settings.type === 'remove' ? true : null;

  $scope.user = settings.user;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.addBook = function() {
    $uibModalInstance.close('add');
  };

  $scope.removeBook = function() {
    $uibModalInstance.close('remove');
  };

  $scope.makeTrade = function(book) {
    $uibModalInstance.close(book);
  };

}]);

// HOME
bookApp.controller('homeCtrl', ['$scope', 'bookFactory', 'modalFactory', '$location', function($scope, bookFactory, modalFactory, $location) {

  $scope.loading = true;

  bookFactory.getBooks('')
    .then(function(response) {
        $scope.loading = false;
        $scope.library = response.data;
      }, function (response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });

  $scope.moreDetails = function(book, type) {
    var user = $scope.current.user ? $scope.current.user.username : undefined;
    var modalInstance = modalFactory.bookDetails(user, book, type);

    modalInstance.result.then(
      function (response) {
        bookFactory.pendingTrade(book);
        $location.url('/new-trade');
      },
      function (response) {
        //console.log(response)
      });
  };

}]);

// PROFILE
bookApp.controller('userCtrl', ['$scope', 'bookFactory', function($scope, bookFactory) {


}]);

// MY TRADES
bookApp.controller('myTradesCtrl', ['$scope', 'bookFactory', function($scope, bookFactory) {

  var getOffers = function() {
    bookFactory.getTrades('offer', $scope.current.user.username, null)
      .then(function(response) {
        $scope.myOffers = response.data;
        $scope.offerResponses = $scope.myOffers.filter(function(trade) { return trade.status !== 'pending'; }).length;
      }, function (response) {
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });
  };
  

  var getRequests = function() {
    bookFactory.getTrades('request', $scope.current.user.username, null)
      .then(function(response) {
        $scope.myRequests = response.data;
        $scope.newRequests = $scope.myRequests.filter(function(trade) { return trade.status === 'pending'; }).length;
      }, function (response) {
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });
  };
  
  getOffers();
  getRequests();

  $scope.getOffers = function() {
    $scope.showOffers = true;
    $scope.showRequests = false;
  };

  $scope.getRequests = function() {
    $scope.showOffers = false;
    $scope.showRequests = true;
  };

  $scope.removeTrade = function(trade, type) {
    bookFactory.removeTrade(trade._id)
      .then(function(response) {
        if (type === 'offer') {
          $scope.myOffers       = $scope.myOffers.filter(function(myTrade) { return myTrade._id !== trade._id; });
          $scope.offerResponses += trade.status === 'pending' ? 0 : -1;
        } else {
          $scope.myRequests  = $scope.myRequests.filter(function(myTrade) { return myTrade._id !== trade._id; });
          $scope.newRequests += trade.status === 'pending' ? 0 : -1;
        }
      }, function (response) {
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });
  };

  $scope.requestResponse = function(trade, accept) {
    bookFactory.respondToTrade(trade._id, accept)
      .then(function(response) {
        trade.status = accept ? 'accepted' : 'rejected';
        $scope.newRequests--;
        getRequests();
      }, function(response) {
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });
  };

  $scope.hideTrade = function(trade, type) {
    bookFactory.hideTrade(trade._id, type)
      .then(function(response) {
        if (type === 'offer') { 
          $scope.myOffers       = $scope.myOffers.filter(function(myTrade) { return myTrade._id !== trade._id; });
          $scope.offerResponses += -1;
        }
        else if (type === 'request') { 
          $scope.myRequests  = $scope.myRequests.filter(function(myTrade) { return myTrade._id !== trade._id; });
        }
      }, function(response) {
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });
  };

}]);

// NEW TRADE
bookApp.controller('newTradeCtrl', ['$scope', 'bookFactory', 'modalFactory', 'pending', function($scope, bookFactory, modalFactory, pending) {

  $scope.pending = pending;

  $scope.loading = true;

  $scope.bookOffer = {
    image: '/imgs/placeholder.png'
  };

  bookFactory.getBooks($scope.current.user.username)
    .then(function(response) {
        $scope.loading = false;
        $scope.myBooks = response.data;
      }, function (response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });

  $scope.offer = function(book) {
    $scope.bookOffer = book;
  };

  $scope.initiateTrade = function(offer, request) {
    var newTrade = {
      offer   : {
        owner : offer.owner,
        ISBN  : offer.ISBN,
      },
      request : {
        owner : request.owner,
        ISBN  : request.ISBN,
      }
    };

    bookFactory.newTrade(newTrade)
      .then(function successCB (response) {
        console.log(response);
        bookFactory.redirect('/my-trades');

      }, function errorCB (response) {
        if (response.data == "Trade already exists") {
          var modalInstance = modalFactory.confirm('Trade already exists');
        } else {
          console.error(response.status + ':' + response.statusText);
          bookFactory.redirect('/error');
        }
      });
  };

}]);

// MY BOOKS
bookApp.controller('myBooksCtrl', ['$scope', 'bookFactory', 'modalFactory', function($scope, bookFactory, modalFactory) {

  bookFactory.getBooks($scope.current.user.username)
    .then(function(response) {
        $scope.myBooks = response.data;
      }, function (response) {
        console.error(response.status + ':' + response.statusText);
        bookFactory.redirect('/error');
      });

  $scope.query = {};
  
  $scope.search = function(query) {
    var valid = /^[A-Za-z0-9\s\-_,\.;:()]+$/;

    if (!query.title) {
      var modalInstance = modalFactory.confirm('Please provide a title before searching');
    }
    else if ( query.title.match(valid)) {
      $scope.searching = true;
      bookFactory.search(query)
        .then(function(response) {
          $scope.searching = false;
          $scope.searchResults = response.data;
        }, function(response) {
          $scope.searching = false;
          console.error(response.status + ':' + response.statusText);
          bookFactory.redirect('/error');
        });
    } else {
      var modalInstance = modalFactory.confirm('Invalid Character Used');
      query.title = undefined;
    }

    
  };

  $scope.moreDetails = function(book, type) {
    var check = $scope.myBooks.filter(function(myBook) {
      return myBook.ISBN === book.ISBN;
    });

    book.owner = check.length ? $scope.current.user.username : null;

    var modalInstance = modalFactory.bookDetails($scope.current.user.username, book, type);

    modalInstance.result.then(
      function(response) {
        if (response === 'add') {
          // Adding Book
          bookFactory.addBook(book)
            .then(function successCB (response) {
              $scope.myBooks.push(response.data);
            }, function errorCB (response) {
              console.error(response.status + ':' + response.statusText);
              bookFactory.redirect('/error');
            });

        } else if (response === 'remove') {
          // Removing Book
          bookFactory.removeBook(book)
            .then(function successCB (response) {
              $scope.myBooks = $scope.myBooks.filter(function(myBook) {
                return myBook.ISBN !== book.ISBN;
              });
            }, function errorCB (response) {
              console.error(response.status + ':' + response.statusText);
              bookFactory.redirect('/error');
            });

        }
      }, 
      function (response) {
        //console.log(response)
      }
    );
    
  };
}]);

// SETTINGS
bookApp.controller('settingsCtrl', ['$scope', 'accountFactory', function($scope, accountFactory) {

    var setDefaults = function() {
      $scope.defaults = {
        firstname    : $scope.current.user.name.first,
        lastname     : $scope.current.user.name.last,
        province     : $scope.current.user.address.province,
        city         : $scope.current.user.address.city
      };
      $scope.update = angular.copy($scope.defaults);
    };
    
    setDefaults();

    $scope.locations = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'];

    $scope.submit = function(update, defaults) {

        $scope.errMsg     = '';
        $scope.successMsg = '';

        accountFactory.updateInfo(update)
          .then(function successCB (response) {
            if (response.data.message) {
              console.error(response.data.message);
              $scope.errMsg = response.data.message;
            }
            if (response.data._id) {
              $scope.successMsg = 'Info Updated';
              $scope.current.user = response.data;
              setDefaults();
            }
          }, function errorCB (response) {
            console.error(response.status + ':' + response.statusText);
            accountFactory.redirect('/error');
          });
      // }
    };

}]);

bookApp.controller('errorCtrl', ['$scope', function($scope){
  $scope.message = "Error";
}]);


bookApp.directive("pwMatch", function() {
  //http://odetocode.com/blogs/scott/archive/2014/10/13/confirm-password-validation-in-angularjs.aspx
  return {
    require: "ngModel",
    scope: {
      password: "=pwMatch"
    },
    link: function(scope, element, attributes, ngModel) {

      ngModel.$validators.pwMatch = function(modelValue) {
        return modelValue == scope.password;
      };

      scope.$watch("password", function() {
        ngModel.$validate();
      });
    }
  };
});
