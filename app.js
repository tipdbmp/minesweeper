angular.module('app', [
    'ngRoute'
  , 'ui.bootstrap'
  , 'app.ctrl.Minesweeper'
//  , 'app.ctrl.B'
])
.config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/A', {
        templateUrl: 'Minesweeper/Minesweeper.html', controller: 'app.ctrl.Minesweeper'
    })
//    .when('/B', {
//        templateUrl: 'B/B.html', controller: 'app.ctrl.A'
//    })
//    .otherwise({
//        redirectTo: '/A'
//    })
    ;
}])
.controller('root', function($scope, $location) {
    $scope.tabhref = function(url) {
//        console.log($location.path());
        $location.path(url);
//        console.log($location.path());
    };
})
;
