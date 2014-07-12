var module = angular.module('app',['mtagging']);

module.controller('testController', function($scope){
  $scope.text = {content: 'hello'};
  $scope.messages = [];
  $scope.list1 = ['Thach', 'Dung', 'Son', 'Hoang', 'Hien', 'Thanh', 'Huy', 'Linh', 'Tran', 'Thu', 'Do'];
  $scope.list2 = [
    {shortText:'Quoc', longText: 'Quoc Nguyen'},
    {shortText:'Dung', longText: 'Dung Le'},
    {shortText:'Thach', longText: 'Thach nguyen'},
  ];

  $scope.list = $scope.list1;

  $scope.changeList = function() {
    $scope.list = $scope.list2;
  }

  $scope.sendMessage = function() {
    console.log('send message');
    $scope.messages.push($scope.text.content);
    $scope.text.content = '';
  }
});
