/*global angular*/
(function(){
  'use strict';
  var module = angular.module('mtagging',[]);

  function SimplePubSub() {
    var events = {};
    return {
        on: function(names, handler) {
            names.split(' ').forEach(function(name) {
                if (!events[name]) {
                    events[name] = [];
                }
                events[name].push(handler);
            });
            return this;
        },
        trigger: function(name, args) {
            angular.forEach(events[name], function(handler) {
                handler.call(null, args);
            });
            return this;
        }
    };
	}


  /*
   * Main directive
   * Usage:
   		[js]
   			$scope.text = {content: ''};
   			$scope.list = ['one', 'two', 'three'];
		 	$scope.list2 = [
			  {shortText:'One', longText: 'Number One'},
			  {shortText:'Two', longText: 'Number two'},
			  {shortText:'Three', longText: 'Number Three'},
			];
   		[/js]

   		[html]
   			<mention-tagging ng-model="text" ng-list="list" ng-tag-symbol="@" enter="sendMessage()"></mention-tagging>
   		[/html]
   */
  module.directive('mentionTagging', function(){
	  return {
	    restrict: 'E',  
	    scope: {
	      'model': '=ngModel',
	      'selectTagSymbol': '@ngTagSymbol',
	      'inputList': '=ngList',   // Array strings or Objects {shortText, longText}
	      'enter': '&'
	      /*
	       * testDirective attribute is an object with fields:
	       * - model: an object with content field { content: "some text"}
	       */
	    },
	    template:
	      '<div class="mention-tagging-wrap">' +
	      	'<ul ng-show="isShowTagging">' +
	        	'<li ng-repeat="item in displayItemList" ng-class="{selected: $index == selectedIndex}" ng-click="selectTag($index)"">' +
	         	'<span>{{item.textShow}}</span>' +
	        	'</li>' +
	      	'</ul>' +
	      	'<textarea ng-model="model.content"></textarea>' +
      	'</div>',
	    controller: ['$scope', '$filter', function ($scope, $filter) {
	      $scope.events = SimplePubSub();
	      $scope.selectedIndex = 0;
	      $scope.maxDisplayItems = 5;
	      $scope.displayItemLength = 0;
	      $scope.isShowTagging = false;
	      $scope.displayItemList;
	      $scope.currentTagSymbolPosition = null;
	      $scope.lastFilterString = null;
	      // $scope.isPauseTagging = false;

	      if (!$scope.selectTagSymbol) $scope.tagSymbol = '@';
	      else $scope.tagSymbol = $scope.selectTagSymbol;

	      function _clearTag() {
	        $scope.isShowTagging = false;
	        $scope.currentTagSymbolPosition = null;
	        //$scope.isPauseTagging = false;
	      }

	      function _selectTag() {
	        var currentCaretPosition = $scope.input.selectionStart,
	            start = $scope.currentTagSymbolPosition,
	            end = currentCaretPosition,
	            length = $scope.model.content.length,
	            replacement = $scope.displayItemList[$scope.selectedIndex].value,
	            newCaretPositon = replacement.length + $scope.currentTagSymbolPosition + 1,
	            newStr =  $scope.model.content.substr(0,start) + replacement + ' ' + $scope.model.content.substring(end, length);
	        
	        _clearTag();

	        // Set new caret postion
	        $scope.model.content = newStr;      
	        setTimeout(function(){
	          $scope.input.focus();
	          $scope.input.setSelectionRange(newCaretPositon, newCaretPositon);
	        }, 50);
	      }

	      $scope.selectTag = function(index) {
	        $scope.selectedIndex = index;
	        _selectTag();
	      }

	      $scope.$watch('inputList', function(){
	        $scope.list = [];
	        if ($scope.inputList[0] && typeof($scope.inputList[0]) == 'object') {
	          $scope.list = [];

	          // Flat list
	          for (var i=0; i<$scope.inputList.length; i++) {
	            $scope.list.push({textShow: $scope.inputList[i].longText + ' (' + $scope.tagSymbol + $scope.inputList[i].shortText + ')', value: $scope.inputList[i].shortText });
	          }

	        } else {
	          for (var i=0; i<$scope.inputList.length; i++) {
	            $scope.list.push({textShow: $scope.inputList[i], value: $scope.inputList[i]});
	          }
	        }

	        _clearTag();
	        $scope.lastFilterString = '_';
	      });

	      $scope.events
	        .on('show-tag', function(isShow, caretPos){
	          $scope.isShowTagging = isShow;
	          //$scope.isPauseTagging = false;
	          $scope.$apply();
	        })
	        // .on('pause-tag', function(){
	        //   console.log('pause tag');
	        //   $scope.isPauseTagging = true;
	        //   $scope.isShowTagging = false;
	        //   $scope.$apply();
	        // })
	        .on('start-tag', function(caretPos){
	          $scope.isShowTagging = true;
	          $scope.selectedIndex = 0
	          $scope.currentTagSymbolPosition = caretPos;
	          $scope.events.trigger('filter-list', '');
	          //$scope.isPauseTagging = false;
	          $scope.$apply();
	        })
	        .on('clear-tag', function(){
	          _clearTag();
	          $scope.$apply();
	        })
	        .on('select-tag', function(){
	          _selectTag();
	          $scope.$apply();

	        })
	        .on('filter-list', function(str){
	          if (str == $scope.lastFilterString) return;

	          $scope.selectedIndex = 0;

	          $scope.displayItemList = $filter('filter')($scope.list, str);
	          $scope.displayItemList = $filter('limitTo')($scope.displayItemList, $scope.maxDisplayItems);
	          $scope.displayItemList = $filter('orderBy')($scope.displayItemList, 'textShow');
	          $scope.displayItemLength = $scope.displayItemList.length;

	          $scope.lastFilterString = str;
	          $scope.$apply();
	        })
	        .on('move-down', function(){
	          if ($scope.isShowTagging) {
	            $scope.selectedIndex ++;
	            ($scope.selectedIndex >= $scope.displayItemLength) && ($scope.selectedIndex = 0);
	          }
	        })
	        .on('move-up', function(){
	          if ($scope.isShowTagging) {
	            $scope.selectedIndex --;
	            ($scope.selectedIndex < 0 ) && ($scope.selectedIndex = $scope.displayItemLength - 1);
	          }
	        })
	        ;
	    }],
	    link: function(scope, element, attrs, tagCtrl) {
	      var input = element.find('textarea'),
	          events = scope.events;
	      scope.input = input[0];

	      document.querySelector("html").addEventListener('click', function(event){
	        // Hide tag when click outsite textbox
	        if (event.target != scope.input) scope.events.trigger('clear-tag');
	      });

	      input.on('keydown', function(event){
	        // Enter key
	        if (event.which == 13) {
	          if (scope.isShowTagging && scope.displayItemList.length > 0) {
	            event.preventDefault();
	            scope.events.trigger('select-tag');
	          } 
	          else {
	            if (!event.shiftKey) {
	              scope.enter();
	              scope.$apply();
	              event.preventDefault();

	              scope.events.trigger('clear-tag');
	            }
	          }
	        } else {
	          // Key down
	          if (event.which == 40) {
	            events.trigger('move-down');
	            if (scope.isShowTagging) {
	              event.preventDefault();
	            }
	            return;
	          }

	          // Key up
	          if (event.which == 38) {
	            events.trigger('move-up')
	            if (scope.isShowTagging) {
	              event.preventDefault();
	            }
	            return;
	          }
	        }

	      });

	      input.on('keyup', function(event){
	        if (event.which != 13) {
	          var caretPos = scope.input.selectionStart;
	          if (scope.currentTagSymbolPosition == null && scope.model.content[caretPos-1] == scope.tagSymbol) {
	            events.trigger('start-tag', caretPos);
	            return;
	          }

	          // Space
	          if (event.which == 32) {
	            events.trigger('clear-tag');
	            return;
	          }

	          // Update filter string
	          if (scope.isShowTagging) {
	            if (caretPos >= scope.currentTagSymbolPosition) {
	              var filterStr = scope.model.content.slice(scope.currentTagSymbolPosition, caretPos);
	              events.trigger('filter-list', filterStr);
	              events.trigger('show-tag', true);
	            }

	            if (caretPos < scope.currentTagSymbolPosition) {
	              events.trigger('clear-tag');
	            }
	          }
	        }
	      });
	    }
	  }
	});
})();