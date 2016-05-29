var app = angular.module('plunker', ['ui.ace']);

app.config(['$compileProvider', function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/./);
}]);

app.controller('MainCtrl', function($scope) {
  $scope.bookmarklet = $scope.bookmarklet || "";
  $scope.options = {};
  $scope.options.jQuery = false;
  // code = 'void function () {' + code + '}();';
  var jQueryURL = "http://code.jquery.com/jquery-latest.min.js";
  $scope.aceChanged = function(_editor) {
    // Get Current Value
    var currentValue = ace.edit("editor").getValue();

    // Add jQuery, if requested (also adds IIFE wrapper).
    if ($scope.options.jQuery) {
      $scope.bookmarklet =
        'void function ($) {' +
        '  var loadBookmarklet = function ($) {' + currentValue + '};' +
        '  var hasJQuery = $ && $.fn;' +
        '  if(hasJQuery) {' +
        '    loadBookmarklet($);' +
        '  } else {' +
        '    var s = document.createElement("script");' +
        '    s.src = "' + jQueryURL + '";' +
        '    s.onload = s.onreadystatechange = function () {' +
        '      var state = this.readyState;' +
        '      if(!state || state === "loaded" || state === "complete") {' +
        '        loadBookmarklet(jQuery.noConflict());' +
        '      }' +
        '    };' +
        '  }' +
        '  document.getElementsByTagName("head")[0].appendChild(s);' +
        '}(window.jQuery);';
    } else {
      $scope.bookmarklet = 'javascript:void function () {' + currentValue + '}();'
    }
  };

  $scope.aceLoaded = function() {
    $scope.aceChanged();
  }

});