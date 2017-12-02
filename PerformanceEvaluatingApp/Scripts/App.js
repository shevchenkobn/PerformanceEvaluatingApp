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
module.directive('test', ["$location", function ($location) {
    var directive = {
        restrict: 'E',
        scope: {},
    };
    var port = $location.port();
    directive.templateUrl = $location.protocol() +
        "://" +
        $location.host() +
        (port ? ':' + port : '') +
        '/Scripts/Templates/Test.html';
    function controller($scope) {
        var dictionary = {
            IpAddress: 'Ip Address',
            CountryCode: 'Country Code',
            CountryName: 'Country Name',
            RegionName: 'Region Name',
            RegionCode: 'Region Code',
            City: 'City',
            ZipCode: 'Zip Code',
            TimeZone: 'Time Zone',
            MetroCode: 'Metro Code'
        };
        var coordinates = (function() {
            var coords = {};
            function add(prop, value) {
                if (typeof value === 'number') {
                    coords[prop] = value;
                }
            }

            var string = '';
            add.toString = function() {
                if (!string) {
                    var first = true;
                    for (var prop in coords) {
                        if (!coords.hasOwnProperty(prop)) {
                            continue;
                        }
                        if (!first) {
                            string += ', ';
                        } else {
                            first = !first;
                        }
                        string += prop + ': ' + coords[prop];
                    }
                }
                return string;
            }
            return add;
        })();
        $scope.ipInfo = [];
        function prepareForDisplay(test) {
            test.Timestamp = new Date(test.Timestamp);
            $scope.ipInfo = {};
            for (var prop in test.IpAddressInfo) {
                if (!test.IpAddressInfo.hasOwnProperty(prop)) {
                    continue;
                }
                if (dictionary[prop] === undefined) {
                    coordinates(prop, test.IpAddressInfo[prop]);
                } else if (test.IpAddressInfo[prop]) {
                    $scope.ipInfo[dictionary[prop]] = test.IpAddressInfo[prop];
                }
            }
            var coords = coordinates.toString();
            if (coords) {
                $scope.ipInfo.Coordinates = coords;
            }
        }
        return function (test) {
            if (!test) {
                return;
            }
            if (typeof test === 'string') {
                try {
                    test = JSON.parse(test);
                } catch (e) {
                    return;
                }
            }
            $scope.test = test;
            prepareForDisplay($scope.test);
        };
    }

    directive.link = function($scope, elem, attrs) {
        attrs.$observe('src', controller($scope));
    };
    return directive;
}]);
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
        $scope.webPageHeaders = [
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
        $scope.sort = function (event, object, direction) {
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
            byCodes: function (webPage) {
                return !webPage.HttpStatusCode ||
                    $scope.filter.codes.findIndex(function (el) {
                        return el.selected && el.Code === webPage.HttpStatusCode.Code;
                    }) >=
                    0;
            },
            time: {
                min: Number.MAX_VALUE,
                max: Number.MIN_VALUE
            },
            byTime: function (webPage) {
                if ($scope.filter.time.max < $scope.filter.time.min) {
                    var t = $scope.filter.time.min;
                    $scope.filter.time.min = $scope.filter.time.max;
                    $scope.filter.time.max = t;
                }
                return webPage.RequestTime >= $scope.filter.time.min &&
                    webPage.RequestTime <= $scope.filter.time.max;
            },
            restoreTime: function (event) {
                event.preventDefault();
                $scope.filter.time.min = $scope.filter.time.default[0];
                $scope.filter.time.max = $scope.filter.time.default[1];
            },
            error: {
                yes: true,
                no: true
            },
            byErrors: function (webPage) {
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
                if ($scope.filter.codes.findIndex(function (el) {
                    return webPages[i].HttpStatusCode && el.Code === webPages[i].HttpStatusCode.Code;
                }) <
                    0) {
                    if (webPages[i].HttpStatusCode == null) {
                        continue;
                    }
                    var obj = angular.copy(webPages[i].HttpStatusCode);
                    webPages[i].HttpStatusCode.toString = function () {
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
                try {
                    webPages = JSON.parse(webPages);
                } catch (e) {
                    return;
                }
            }
            $scope.webPages = webPages;
            prepareForDisplay($scope.webPages);
        };
    }

    directive.link = function ($scope, elem, attrs) {
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

        function clearModel() {
            $scope.result = {};
        }
        /////statistics tab
        var gettingData = false;
        $scope.displayingEnum = {
            WEBSITES: 0,
            TESTS: 1,
            WEBPAGES: 2
        }
        $scope.displaying = $scope.displayingEnum.WEBSITES;
        $scope.$watch('currentView',
            function (newVal, oldVal) {
                if (gettingData) {
                    return;
                }
                if (newVal === $scope.views.STAT && $scope.displaying === $scope.displayingEnum.WEBSITES) {
                        getWebsites();
                } else if (oldVal === $scope.views.STAT && $scope.displaying === $scope.displayingEnum.WEBSITES) {
                    clearStatisticsView();
                }
            });
        var stat = {
            websites: null,
            website: null,
            tests: null,
            test: null,
            webPages: null
        };
        $scope.stat = {
            website: null,
            collection: null,
            test: null,
            webPages: null,
            failure: false
        };
        function clearStatisticsView() {
            $scope.collection = {
                failure: false
            };
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
            $scope.stat.failure = false;
            $scope.hints.stat = "Updating Website List...";
            function processResponse(response) {
                if (~~(response.status / 100) === 2) {
                    $scope.stat.collection = response.data;
                    $scope.hints.stat = "";
                } else {
                    $scope.stat.failure = true;
                    $scope.hints.stat = "Failed to Update. Try again.";
                }
                gettingData = false;
            };
        }

        $scope.getTests = function(event, website) {
            event.preventDefault();
            gettingData = true;
            $scope.hints.stat = "Retrieving Tests data...";
            $http.get(getApiUrl() + website.Id).then(
                proceedResponse,
                proceedResponse
            );

            function proceedResponse(response) {
                if (~~(response.status / 100) === 2) {
                    $scope.stat.website = stat.website = website;
                    stat.websites = $scope.stat.collection;
                    $scope.stat.collection = response.data.Tests;
                    for (var i = 0; i < $scope.stat.collection.length; i++) {
                        $scope.stat.collection[i].Timestamp = new Date($scope.stat.collection[i].Timestamp);
                    }
                    $scope.displaying = $scope.displayingEnum.TESTS;
                    $scope.hints.stat = '';
                } else {
                    $scope.hints.stat = "Failed To Retrieve Tests";
                }
                gettingData = false;
            }
        };
        $scope.testHeaders = [
            {
                prop: 'Timestamp',
                value: 'Started'
            },
            {
                prop: 'AverageRequestTime',
                value: 'Average Request Time'
            },
            {
                prop: 'WebPagesCount',
                value: 'Web Pages Tested'
            },
            {
                value: 'Ip Address'
            }
        ];
        $scope.expandIp = function(event, test) {
            event.preventDefault();
        };
        $scope.statFilter = {

        };
        $scope.getTestWebPages = function(event, test) {
            event.preventDefault();
            $scope.hints.stat = "Retrieving Web Pages...";
            gettingData = true;
            $http.get(getApiUrl() + 'test/' + test.Id).then(
                processResponse, processResponse
            );
            function processResponse(response) {
                if (~~(response.status / 100) === 2) {
                    $scope.stat.test = test;
                    stat.tests = $scope.collection;
                    $scope.collection = null;
                    $scope.stat.webPages = response.data.WebPages;
                    $scope.displaying = $scope.displayingEnum.WEBPAGES;
                    $scope.hints.stat = '';
                } else {
                    $scope.hints.stat = "Failed To Retrieve Web Pages";
                }
                gettingData = false;
            }
        };
        $scope.getAllWebPages = function(event, website) {
            event.preventDefault();
        }
        $scope.download = function (event, view) {
            event.preventDefault();
            switch (view) {
                case $scope.views.STAT:
                    if (!$scope.stat.website && !$scope.stat.test) {
                        return;
                    }
                    $scope.hints.stat = "Preparing your file...";
                    if ($scope.stat.website && !$scope.stat.test) {
                        var content = $('#statWebsite')[0].outerHTML +
                            $('#statTests')[0].outerHTML;
                    } else {
                        var content = $('#statTest').html();
                        if ($scope.stat.webPages) {
                            content += '<table>' + $('#statWebPages table').html() + '</table>';
                        }
                    }
                    saveAs(new Blob([content], { type: "text/plain;charset=utf-8" }), 'report.html');
                    $scope.hints.stat = "";
                    break;
            }
        };
    });