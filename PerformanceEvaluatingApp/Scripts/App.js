if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return i;
            }
        }
        return -1;
    };
}

var module = angular.module('Main', []);
module.directive('webPages', ["$location", function ($location) {
    var directive = {
        restrict: 'E',
        scope: {},
    };
    var port = $location.port();
    directive.templateUrl = $location.protocol() +
        "://" +
        $location.host() +
        (port ? ':' + port : '') +
        '/Scripts/Templates/WebPages.html';
    function controller($scope) {
        $scope.websiteHeaders = [
            {
                prop: 'RequestUri',
                value: 'Requested Uri'
            },
            {
                prop: 'HttpStatusCode',
                value: 'Response Code'
            },
            {
                prop: 'RequestTime',
                value: 'Request Length'
            },
            {
                prop: 'Timestamp',
                value: 'Request Start'
            },
            {
                prop: 'Error',
                value: 'Error'
            }
        ];
        $scope.getHttpStatus = function (obj) {
            return obj.Code + ' ' + obj.Phrase;
        };
        $scope.sort = function(event, object, direction) {
            event.preventDefault();
            var matchedI;
            for (var i = 0; i < $scope.sort.criteria.length; i++) {
                if ((matchedI = $scope.sort.criteria[i].indexOf(object.prop)) >= 0) {
                    if (matchedI > 1 ||
                        matchedI === 0 && object.prop.length !== $scope.sort.criteria[i].length ||
                        matchedI === 1 &&
                        !(object.prop.length + 1 === $scope.sort.criteria[i].length &&
                            $scope.sort.criteria[i][0] === '-')) {
                        continue;
                    }
                    break;
                }
            }
            var asc = ' ascending', desc = ' descending';
            if (i === $scope.sort.criteria.length) {
                if (direction > 0) {
                    $scope.sort.criteria[i] = object.prop;
                    $scope.sort.order[i] = object.value + asc;
                } else if (direction < 0) {
                    $scope.sort.criteria[i] = '-' + object.prop;
                    $scope.sort.order[i] = object.value + desc;
                }
                return;
            }
            switch (direction) {
            case -1:
                if (matchedI === 0) {
                    $scope.sort.criteria[i] = '-' + object.prop;
                    $scope.sort.order[i] = object.value + desc;
                }
                break;
            case 0:
                $scope.sort.criteria.splice(i, 1);
                $scope.sort.order.splice(i, 1);
                break;
            case 1:
                if (matchedI === 1) {
                    $scope.sort.criteria[i] = object.prop;
                    $scope.sort.order[i] = object.value + asc;
                }
                break;
            }
        };
        $scope.sort.criteria = [];
        $scope.sort.order = [];
        //// filter
        $scope.filter = {
            codes: [],
            byCodes: function(webPage) {
                return !webPage.HttpStatusCode ||
                    $scope.filter.codes.findIndex(function(el) {
                        return el.selected && el.Code === webPage.HttpStatusCode.Code;
                    }) >=
                    0;
            },
            time: {
                min: Number.MAX_VALUE,
                max: Number.MIN_VALUE
            },
            byTime: function(webPage) {
                if ($scope.filter.time.max < $scope.filter.time.min) {
                    var t = $scope.filter.time.min;
                    $scope.filter.time.min = $scope.filter.time.max;
                    $scope.filter.time.max = t;
                }
                return webPage.RequestTime >= $scope.filter.time.min &&
                    webPage.RequestTime <= $scope.filter.time.max;
            },
            restoreTime: function(event) {
                event.preventDefault();
                $scope.filter.time.min = $scope.filter.time.default[0];
                $scope.filter.time.max = $scope.filter.time.default[1];
            },
            error: {
                yes: true,
                no: true
            },
            byErrors: function(webPage) {
                return $scope.filter.error.yes && !webPage.Error || $scope.filter.error.no && webPage.Error;
            }
        };

        function prepareForDisplay(webPages) {
            if (!webPages) {
                return resetFilters();
            }
            $scope.filter.codes = [];
            for (var i = 0; i < webPages.length; i++) {
                webPages[i].Timestamp = new Date(webPages[i].Timestamp);
                if ($scope.filter.codes.findIndex(function(el) {
                        return webPages[i].HttpStatusCode && el.Code === webPages[i].HttpStatusCode.Code;
                    }) <
                    0) {
                    if (webPages[i].HttpStatusCode == null) {
                        continue;
                    }
                    var obj = angular.copy(webPages[i].HttpStatusCode);
                    webPages[i].HttpStatusCode.toString = function() {
                        return this.Code + ' ' + this.Phrase;
                    }
                    obj.selected = true;
                    $scope.filter.codes.push(obj);
                }
                if (webPages[i].RequestTime <= 0 && !webPages[i].Error) {
                    webPages[i].Error = 'Undefined server error';
                }
                $scope.filter.time.min = Math.min($scope.filter.time.min, webPages[i].RequestTime);
                $scope.filter.time.max = Math.max($scope.filter.time.max, webPages[i].RequestTime);
            }
            $scope.filter.time.default = [$scope.filter.time.min, $scope.filter.time.max];
        }

        function resetFilters() {
            $scope.sort.criteria = [];
            $scope.sort.order = [];

            $scope.filter.query =
                $scope.filter.time.default = undefined;
            $scope.filter.time.min = Number.MAX_VALUE;
            $scope.filter.time.max = Number.MIN_VALUE;
            $scope.filter.error.yes = $scope.filter.error.no = true;
            $scope.filter.collection = [];
            $scope.filter.codes = [];
        }

        return function (webPages) {
            if (typeof webPages === 'string') {
                webPages = JSON.parse(webPages);
            }
            $scope.webPages = webPages;
            prepareForDisplay($scope.webPages);
        };
    }

    directive.link = function($scope, elem, attrs) {
        attrs.$observe('src', controller($scope));
    };
    return directive;
}]);
    /*
**
*
*
*/
module.controller('MainController',
    function ($scope, $http, $location) {
        var views = $scope.views = {
            TEST: 0,
            STAT: 1
        };
        $scope.currentView = views.TEST;
        $scope.url = 'http://keepearthquakesweird.com/';
        var tested = [];
        $scope.result = {};
        $scope.hints = {};
        $scope.processing = false;
        $scope.testWebsite = function(event) {
            event.preventDefault();
            if ($scope.processing) {
                return;
            }
            if (!$scope.url) {
                alert('Url is invalid');
                return;
            }
            clearModel();
            $scope.processing = true;
            $http.post(getApiUrl(), $scope.url).then(proceedResponse, proceedResponse);

            function proceedResponse(response) {
                if (~~(response.status / 100) === 2) {
                    response.data.Timestamp = new Date(response.data.Timestamp);
                    tested.push(angular.copy(response.data));
                    $scope.result.test = response.data;
                    $scope.hints.test = '';
                } else {
                    if (~~(response.status / 100) === 4) {
                        $scope.hints.test = 'Something went wrong. Ensure URL is correct.';
                    } else {
                        $scope.hints.test = 'Something went wrong. Try again later';
                    }
                }
                $scope.processing = false;
            }

            $scope.hints.test = 'Your request is being processed';
        };
        $scope.getWebpages = function(event) {
            event.preventDefault();
            if (!$scope.result.test) {
                return;
            }
            $http.get(getApiUrl('test/' + $scope.result.test.Id)).then(
                processResponse, processResponse
            );
            function processResponse(response) {
                if (~~(response.status / 100) === 2) {
                    $scope.result.webPages = response.data.WebPages;
                    $scope.hints.webPages = '';
                } else {
                    $scope.hints.webPages = 'Something went wrong. Try again.';
                }
            }
            $scope.hints.webPages = 'Retrieving data...';
        }
        $scope.deleteTest = function(event) {
            event.preventDefault();
            if (confirm('Are you sure to delete this test?')) {
                $http.delete(getApiUrl(),
                {
                    data: $scope.result.test.TestHash
                }).then(function() {
                    tested.pop(); // assume that test is the last added element
                    clearModel();
                    $scope.hints.test = "The test is deleted";
                }, function() {
                    $scope.hints.test = "Unable to delete. Try again;";
                });
                $scope.hints.test = "Trying to delete";
            }
        };
        function getApiUrl(string) {
            if (!string) {
                string = '';
            }
            if (!getApiUrl.base) {
                var prefix = '/websites/';
                var port = $location.port();
                getApiUrl.base = $location.protocol() +
                    '://' +
                    $location.host() +
                    (port ? ':' + port : '') +
                    prefix;
            }
            return getApiUrl.base + string;
        }
        //// FILTERS sorting
        //$scope.getHttpStatus = function (obj) {
        //    return obj.Code + ' ' + obj.Phrase;
        //};
        //$scope.websiteHeaders = [
        //    {
        //        prop: 'RequestUri',
        //        value: 'Requested Uri'
        //    },
        //    {
        //        prop: 'HttpStatusCode',
        //        value: 'Response Code'
        //    },
        //    {
        //        prop: 'RequestTime',
        //        value: 'Request Length'
        //    },
        //    {
        //        prop: 'Timestamp',
        //        value: 'Request Start'
        //    },
        //    {
        //        prop: 'Error',
        //        value: 'Error'
        //    }
        //];
        //$scope.sort = function(event, object, direction) {
        //    event.preventDefault();
        //    var matchedI;
        //    for (var i = 0; i < $scope.sort.criteria.length; i++) {
        //        if ((matchedI = $scope.sort.criteria[i].indexOf(object.prop)) >= 0) {
        //            if (matchedI > 1 ||
        //                matchedI === 0 && object.prop.length !== $scope.sort.criteria[i].length ||
        //                matchedI === 1 && !(object.prop.length + 1 === $scope.sort.criteria[i].length &&
        //                $scope.sort.criteria[i][0] === '-')) {
        //                continue;
        //            }
        //            break;
        //        }
        //    }
        //    var asc = ' ascending', desc = ' descending';
        //    if (i === $scope.sort.criteria.length) {
        //        if (direction > 0) {
        //            $scope.sort.criteria[i] = object.prop;
        //            $scope.sort.order[i] = object.value + asc;
        //        } else if (direction < 0) {
        //            $scope.sort.criteria[i] = '-' + object.prop;
        //            $scope.sort.order[i] = object.value + desc;
        //        }
        //        return;
        //    }
        //    switch (direction) {
        //        case -1:
        //            if (matchedI === 0) {
        //                $scope.sort.criteria[i] = '-' + object.prop;
        //                $scope.sort.order[i] = object.value + desc;
        //            }
        //            break;
        //        case 0:
        //            $scope.sort.criteria.splice(i, 1);
        //            $scope.sort.order.splice(i, 1);
        //            break;
        //        case 1:
        //            if (matchedI === 1) {
        //                $scope.sort.criteria[i] = object.prop;
        //                $scope.sort.order[i] = object.value + asc;
        //            }
        //            break;
        //    }
        //};
        //$scope.sort.criteria = [];
        //$scope.sort.order = [];
        ////// filter
        //$scope.filter = {
        //    codes: [],
        //    byCodes: function (webPage) {
        //        return !webPage.HttpStatusCode || $scope.filter.codes.findIndex(function(el) {
        //                return el.selected && el.Code === webPage.HttpStatusCode.Code;
        //            }) >=
        //            0;
        //    },
        //    time: {
        //        min: Number.MAX_VALUE,
        //        max: Number.MIN_VALUE
        //    },
        //    byTime: function (webPage) {
        //        if ($scope.filter.time.max < $scope.filter.time.min) {
        //            var t = $scope.filter.time.min;
        //            $scope.filter.time.min = $scope.filter.time.max;
        //            $scope.filter.time.max = t;
        //        }
        //        return webPage.RequestTime >= $scope.filter.time.min &&
        //            webPage.RequestTime <= $scope.filter.time.max;
        //    },
        //    restoreTime: function(event) {
        //        event.preventDefault();
        //        $scope.filter.time.min = $scope.filter.time.default[0];
        //        $scope.filter.time.max = $scope.filter.time.default[1];
        //    },
        //    error: {
        //        yes: true,
        //        no: true
        //    },
        //    byErrors: function (webPage) {
        //        return $scope.filter.error.yes && !webPage.Error || $scope.filter.error.no && webPage.Error;
        //    }
        //};
        //function prepareForDisplay(webPages) {
        //    $scope.filter.codes = [];
        //    for (var i = 0; i < webPages.length; i++) {
        //        webPages[i].Timestamp = new Date(webPages[i].Timestamp);
        //        if ($scope.filter.codes.findIndex(function(el) {
        //            return webPages[i].HttpStatusCode && el.Code === webPages[i].HttpStatusCode.Code;
        //        }) < 0) {
        //            var obj = angular.copy(webPages[i].HttpStatusCode);
        //            if (obj == null) {
        //                continue;
        //            }
        //            obj.selected = true;
        //            $scope.filter.codes.push(obj);
        //        }
        //        if (webPages[i].RequestTime <= 0 && !webPages[i].Error) {
        //            webPages[i].Error = 'Undefined server error';
        //        }
        //        $scope.filter.time.min = Math.min($scope.filter.time.min, webPages[i].RequestTime);
        //        $scope.filter.time.max = Math.max($scope.filter.time.max, webPages[i].RequestTime);
        //    }
        //    $scope.filter.time.default = [$scope.filter.time.min, $scope.filter.time.max];
        //}
        ////

        function clearModel() {
            $scope.result = {};
        }
        /////statistics tab
        var gettingData = false;
        $scope.displayingEnum = {
            WEBSITES: 0,
            TESTS: 1
        }
        $scope.displaying = displayedEnum.WEBSITES;
        $scope.$watch('currentView',
            function (newVal) {
                if (gettingData) {
                    return;
                }
                if (newVal === $scope.views.STAT) {
                    getWebsites();
                } else if ($scope.displaying === $scope.displayedEnum.WEBSITES) {
                    clearStatisticsView();
                }
            });
        var websites = [];
        var tests = [];
        $scope.website = null;
        $scope.collection = null;
        $scope.failure = false;
        function clearStatisticsView() {
            $scope.collection = undefined;
        }
        $scope.retryUpdate = function(event) {
            event.preventDefault();
            getWebsites();
        }
        function getWebsites() {
            $http.get(getApiUrl()).then(
                processResponse, processResponse
            );
            gettingData = true;
            $scope.failure = false;
            $scope.hints.stat = "Updating Website List...";
            function processResponse(response) {
                if (~~(response.code / 200) === 2) {
                    $scope.collection = response.data;
                    $scope.hints.stat = "";
                } else {
                    $scope.failure = true;
                    $scope.hints.stat = "Failed to Update. Try again.";
                }
                gettingData = false;
            };
        }
        $scope.getTests = function(event, website) {
            event.preventDefault();
            $scope.website = website;
            websites = $scope.collection;
            gettingData = true;
            $scope.hints.stat = "Retrieving data...";
            $http.get(getApiUrl() + website.Id).then(
                proceedResponse, proceedResponse
            );
            function proceedResponse(response) {
                if (~~(response.code / 200) === 2) {

                } else {
                    $scope.hints.stat = "Failed To Retrieve";
                    $scope.website = null;
                    $scope.collection = websites;
                }
                gettingData = false;
            }
        }
    });