'use strict';

var bookApp = angular.module('votingApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap']);

// ACCOUNT FACTORTY
bookApp.factory('accountFactory', ['$http', '$window', '$location', function($http, $window, $location) {

  var storedUser = { user: undefined }

  return {    
    fetchUser: function() {
      return $http.get('/auth/user')
    },

    getUser: storedUser,

    setUser: function(user) {
      storedUser.user = user
    },

    localSignUp: function(user) {
      return $http.post('/auth/local-signup', user)
    },

    localSignIn: function(user) {
      return $http.post('/auth/local-login', user)
    },

    updateInfo: function(info) {
      return $http.post('/auth/update', info)
    },

    redirect: function(path) {
      $location.url(path)
    },

    logout: function(){
      storedUser.user = undefined;
      $http.get('/auth/logout').then(function(response) {
        return response.data
      });
      $location.url('/')
    }
  }
}])

// MODAL FACTORTY
bookApp.factory('modalFactory', ['$uibModal', function($uibModal) {
  
  return {
    login: function(scope) {
      
      var modalOptions = {
        animation: true,
        templateUrl: 'partials/form-modal',
        controller: 'loginModalCtrl'
      }
      
      if (scope) {
        modalOptions.scope = scope
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
      }
      
      return $uibModal.open(modalOptions);
    },
    
    confirm: function(dialog, choose) {

      var choice = '';
      if (choose) {
        choice += '<button class="btn btn-primary col-xs-6" ng-click="confirm()">Okay</button>'
        choice += '<button class="btn btn-danger col-xs-6" ng-click="cancel()">Cancel</button>'
      } else {
        choice = '<button class="btn btn-primary col-xs-6 col-xs-offset-3" ng-click="confirm()">Okay</button>'
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
  }
}])

// BOOK FACTORTY
bookApp.factory('bookFactory', ['$http', '$window', function($http, $window) {

  var pending = { book: null }

  return {    
    getBooks: function(user) {
      return $http.get('/api/allBooks/' + user)
    },

    search: function(query) {
      return $http.post('/api/search', query)
    },

    addBook: function(book) {
      return $http.post('/api/addBook', book)
    },

    removeBook: function(book) {
      return $http.post('/api/removeBook', book)
    },

    pendingTrade: function(book) {
      pending.book = book
    },

    getPendingTrade: pending,

    newTrade: function(newTrade) {
      return $http.post('/api/newTrade', newTrade)
    },

    getTrades: function(type, user, ISBN) {
      return $http.post('/api/getTrades', {type: type, user: user, ISBN: ISBN})
    },

    respondToTrade: function(response) {
      return $http.post('/api/respondToTrade', response)
    },

    removeTrade: function(id) {
      return $http.post('/api/removeTrade', {id: id})
    }
  }
}])

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
            window.location = '/'
          } else {
            return bookFactory.getPendingTrade
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
      $scope.current.user = response.data
      $scope.loaded = true;
    },
    function errorCB (response) {
      console.error(response.status + ':' + response.statusText);
      accountFactory.redirect('/error')
    });

  $scope.newUser = function () {
              
    var modalInstance = modalFactory.login($scope)

    modalInstance.result.then(
      function(user) {
        $scope.current.user = user;
        accountFactory.redirect('/')
      }, 
      function() {
      }
    );
  };

  $scope.logout = function() {
    var modalInstance = modalFactory.confirm('Logout?', true)
    
    modalInstance.result.then(
      function(response) {
        accountFactory.logout()
      }, 
      function() {
      }
    );
     
  }
  
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
  ]

  $scope.atSymbol = "^[^@]*$"

  $scope.validEmail = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"

  $scope.signUp = function(user) {
    $scope.errMsg = ''
    accountFactory.localSignUp(user).then(
      function successCB (response) {
        if (response.data.message) {
          $scope.errMsg = response.data.message
        }
        if (response.data._id) {
          $uibModalInstance.close(response.data)          
        }
      },
      function errorCB (response) {
        console.error(response.status + ':' + response.statusText);
        window.location = '/error'
    });
  }
  
  $scope.signIn = function(user) {
    $scope.errMsg = ''
    accountFactory.localSignIn(user).then(
      function successCB (response) {
        if (response.data.message) {
          $scope.errMsg = response.data.message
        }
        if (response.data._id) {
          $uibModalInstance.close(response.data)
        }
      },
      function errorCB (response) {
        console.error(response.status + ':' + response.statusText);
        window.location = '/error'
    });  
  }
  
  $scope.switch = function(newAccount) {
    $scope.newUser = {};
    $scope.loginForm.$setPristine();
    $scope.errMsg = '';
    $scope.newAccount = !newAccount
  }
  
  $scope.confirm = function() {
    $uibModalInstance.close('yes');
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
  
}]);

// BOOK MODAL
bookApp.controller('bookModalCtrl', ['$scope', '$uibModalInstance', '$http', 'settings', function ($scope, $uibModalInstance, $http, settings) {

  $scope.book   = settings.bookInfo;
  $scope.add    = settings.type === 'add'    ? true : null
  $scope.remove = settings.type === 'remove' ? true : null

  $scope.user = settings.user

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel')
  }

  $scope.addBook = function() {
    $uibModalInstance.close('add')
  }

  $scope.removeBook = function() {
    $uibModalInstance.close('remove')
  }

  $scope.makeTrade = function(book) {
    $uibModalInstance.close(book)
  }

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
        window.location = '/error';
      });

  $scope.moreDetails = function(book, type) {
    var user = $scope.current.user ? $scope.current.user.username : undefined
    var modalInstance = modalFactory.bookDetails(user, book, type)

    modalInstance.result.then(
      function (response) {
        bookFactory.pendingTrade(book)
        $location.url('/new-trade')
      }, 
      function (response) {
        //console.log(response)
      });
  }

}]);

// PROFILE
bookApp.controller('userCtrl', ['$scope', 'bookFactory', function($scope, bookFactory) {


}]);

// MY TRADES
bookApp.controller('myTradesCtrl', ['$scope', 'bookFactory', function($scope, bookFactory) {

    bookFactory.getTrades('offer', $scope.current.user.username, null)
    .then(function(response) {
        $scope.loading = false;
        $scope.myOffers = response.data;
        $scope.offerResponses = $scope.myOffers.filter(function(trade) { return trade.status !== 'pending' }).length
      }, function (response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        window.location = '/error';
      });

  bookFactory.getTrades('request', $scope.current.user.username, null)
    .then(function(response) {
        $scope.loading = false;
        $scope.myRequests = response.data;
        $scope.newRequests = $scope.myRequests.filter(function(trade) { return trade.status === 'pending' }).length
      }, function (response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        window.location = '/error';
      });

  $scope.getOffers = function() {
    $scope.showOffers = true;
    $scope.showRequests = false;
  }

  $scope.getRequests = function() {
    $scope.showOffers = false;
    $scope.showRequests = true;
  }

}]);

// NEW TRADE
bookApp.controller('newTradeCtrl', ['$scope', 'bookFactory', 'pending', function($scope, bookFactory, pending) {

  $scope.pending = pending

  $scope.loading = true

  $scope.bookOffer = {
    image: 'http://placehold.it/128x192'
  }

  bookFactory.getBooks($scope.current.user.username)
    .then(function(response) {
        $scope.loading = false;
        $scope.myBooks = response.data;
      }, function (response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        window.location = '/error';
      });

  $scope.offer = function(book) {
    $scope.bookOffer = book
  }

  $scope.initiateTrade = function(offer, request) {
    var newTrade = {
      offer   : {
        owner : offer.owner,
        ISBN  : offer.ISBN
      },
      request : {
        owner : request.owner,
        ISBN  : request.ISBN
      }
    }

    bookFactory.newTrade(newTrade)
      .then(function successCB (response) {
        console.log(response)
      }, function errorCB (response) {
        if (response.data == "Trade already exists") {
          alert('Trade already exists')
        } else {
          console.error(response.status + ':' + response.statusText);
          window.location = '/error';
        }
      })
  }

}]);

// MY BOOKS
bookApp.controller('myBooksCtrl', ['$scope', 'bookFactory', 'modalFactory', function($scope, bookFactory, modalFactory) {

  $scope.loading = true

  bookFactory.getBooks($scope.current.user.username)
    .then(function(response) {
        $scope.loading = false;
        $scope.myBooks = response.data;
      }, function (response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        window.location = '/error';
      });

  $scope.search = function(query) {

    $scope.loading = true
    bookFactory.search(query)
      .then(function(response) {
        $scope.loading = false;
        $scope.searchResults = response.data
      }, function(response) {
        $scope.loading = false;
        console.error(response.status + ':' + response.statusText);
        window.location = '/error'
      });
  }

  $scope.moreDetails = function(book, type) {
    var check = $scope.myBooks.filter(function(myBook) {
      return myBook.ISBN === book.ISBN
    })

    book.owner = check.length ? $scope.current.user.username : null

    var modalInstance = modalFactory.bookDetails($scope.current.user.username, book, type)

    modalInstance.result.then(
      function(response) {
        if (response === 'add') {
          // Adding Book
          bookFactory.addBook(book)
            .then(function successCB (response) {
              $scope.myBooks.push(response.data)
            }, function errorCB (response) {
              console.error(response.status + ':' + response.statusText);
              window.location = '/error'
            });

        } else if (response === 'remove') {
          // Removing Book
          bookFactory.removeBook(book)
            .then(function successCB (response) {
              $scope.myBooks = $scope.myBooks.filter(function(myBook) {
                return myBook.ISBN !== book.ISBN
              })
            }, function errorCB (response) {
              console.error(response.status + ':' + response.statusText);
              window.location = '/error'
            });

        }
      }, 
      function (response) {
        //console.log(response)
      }
    );
    
  }

  $scope.searchResults = [
    {"title":"Harry Potter and the Cursed Child – Parts One and Two (Special Rehearsal Edition)","authors":["J.K. Rowling","John Tiffany","Jack Thorne"],"ISBN":"1781107041","image":"http://books.google.com/books/content?id=tcSMCwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"},
    {"title":"Harry Potter and the Sorcerer's Stone","authors":["J.K. Rowling"],"ISBN":"1781100489","image":"http://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&source=gbs_api"},
    {"title":"Harry Potter and the Deathly Hallows","authors":["J. K. Rowling"],"ISBN":"1408855712","image":"http://books.google.com/books/content?id=I5nHBAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"},
    {"title":"Harry Potter and the Order of the Phoenix","authors":["J. K. Rowling"],"ISBN":"0545582970","image":"http://books.google.com/books/content?id=Y0HbmAEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"},
    {"title":"Harry Potter Coloring Book","authors":["Inc. Scholastic"],"ISBN":"1338029991","image":"http://books.google.com/books/content?id=lMM4jgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"}
  ]
}]);

// SETTINGS
bookApp.controller('settingsCtrl', ['$scope', 'accountFactory', function($scope, accountFactory) {

    var setDefaults = function() {
      $scope.defaults = {
        firstname    : $scope.current.user.name.first,
        lastname     : $scope.current.user.name.last,
        province     : $scope.current.user.address.province,
        city         : $scope.current.user.address.city
      }
      $scope.update = angular.copy($scope.defaults)
    }
    
    setDefaults()

    $scope.locations = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon']

    $scope.submit = function(update, defaults) {

        $scope.errMsg     = '';
        $scope.successMsg = '';

        accountFactory.updateInfo(update)
          .then(function successCB (response) {
            if (response.data.message) {
              console.error(response.data.message)
              $scope.errMsg = response.data.message
            }
            if (response.data._id) {
              $scope.successMsg = 'Info Updated'
              $scope.current.user = response.data
              setDefaults()
            }
          }, function errorCB (response) {
            console.error(response.status + ':' + response.statusText);
            window.location = '/error'
          });
      // }
    }

}]);

bookApp.controller('errorCtrl', ['$scope', function($scope){
  $scope.message = "Error"
}])


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