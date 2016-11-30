'use strict';

var bookApp = angular.module('votingApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap']);

bookApp.factory('accountFactory', ['$http', '$window', function($http, $window) {

  return {    
    fetchUser: function() {
      return $http.get('/auth/user')
    },

    localSignUp: function(user) {
      return $http.post('/auth/local-signup', user)
    },

    localSignIn: function(user) {
      return $http.post('/auth/local-login', user)
    },
    
    logout: function() {
      $window.location.href = '/logout';      
    }
  }
}])

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

// ROUTING ===============================================================
bookApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
    
    .when('/', {
      templateUrl: 'partials/home',
      controller: 'homeCtrl'
    })
    .when('/profile', {
      templateUrl: 'partials/profile',
      controller: 'userCtrl'
    })    
    .when('/error', {
      templateUrl: 'partials/error',
      controller: 'errorCtrl'
    })

    .otherwise({
      redirectTo: '/'
    });
    
    $locationProvider.html5Mode(true);
}]);

// CONTROLLERS ===========================================================
// NAV 
bookApp.controller('navCtrl', ['$scope', '$location', 'accountFactory', 'modalFactory', function($scope, $location, accountFactory, modalFactory) {
   
  accountFactory.fetchUser().then(
    function successCB (response) {
      $scope.user = response.data.user;
      $scope.loaded = true;
    },
    function errorCB (response) {
      console.error(response.status + ':' + response.statusText);
      window.location = '/error'
    });

  $scope.newUser = function () {
              
    var modalInstance = modalFactory.login($scope)

    modalInstance.result.then(
      function successCB (user) {
        //$scope.user = user
        $scope.user._id = 'blah'
        $scope.user.firstname = 'Testing'
        $location.url('/');
      }, 
      function cancelCB () {
      }
    );
  };

  $scope.logout = function() {
    var modalInstance = modalFactory.confirm('Logout?', true)
    
    modalInstance.result.then(
      function successCB (res) {
        accountFactory.logout();
      }, 
      function cancelCB () {
      }
    );
     
  }
  
}]);

// LOGIN MODAL
bookApp.controller('loginModalCtrl', ['$scope', '$uibModalInstance', '$http', 'accountFactory', function ($scope, $uibModalInstance, $http, accountFactory) {
  
  $scope.signUp = function(user) {
    $scope.errMsg = ''
    console.log('Signed Up')
    // accountFactory.localSignUp(user).then(
    //   function successCB (response) {
    //     if (response.data.message) {
    //       console.log(response.data.message)
    //       $scope.errMsg = response.data.message
    //     }
    //     if (response.data.username) {
    //       $uibModalInstance.close(response.data)          
    //     }
    //   },
    //   function errorCB (response) {
    //     console.error(response.status + ':' + response.statusText);
    //     window.location = '/error'
    // });
  }
  
  $scope.signIn = function(user) {
    $scope.errMsg = ''
    console.log('Signed In')
    // accountFactory.localSignIn(user).then(
    //   function successCB (response) {
    //     if (response.data.message) {
    //       console.log(response.data.message)
    //       $scope.errMsg = response.data.message
    //     }
    //     if (response.data.username) {
    //       $uibModalInstance.close(response.data)
    //     }
    //   },
    //   function errorCB (response) {
    //     console.error(response.status + ':' + response.statusText);
    //     window.location = '/error'
    // });  
  }
  
  $scope.switch = function(newAccount) {
    $scope.local = {};
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

// HOME
bookApp.controller('homeCtrl', ['$scope', function($scope) {


}]);

// PROFILE
bookApp.controller('userCtrl', ['$scope', function($scope) {
    
}]);

bookApp.controller('errorCtrl', ['$scope', function($scope){
  $scope.message = "Error"
}])


// DIRECTIVES
bookApp.directive('pwCheck', [function() {

  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      var password = attrs.pwCheck
      
      elem.on('keyup', function() {
        scope.$apply(function() {
          var valid = elem.val() === scope.user.local[password];
          ctrl.$setValidity('pwmatch', valid);
        });
      });
    }
  }

}]);