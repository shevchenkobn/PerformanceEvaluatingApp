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
                $scope.test = null;
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
    function controller($scope, tableId) {
        $scope.tableId = tableId;
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
            resetFilters();
            if (!webPages) {
                return;
            }
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
            if (!webPages) {
                $scope.webPages = null;
                return;
            }
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
        attrs.$observe('src', controller($scope, attrs.tableId));
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
            WEBPAGES: 2,
            ALL_WEBPAGES: 3
        }
        $scope.displaying = $scope.displayingEnum.WEBSITES;
        $scope.$watch('currentView',
            function (newVal, oldVal) {
                if (gettingData) {
                    return;
                }
                if (newVal === $scope.views.STAT && $scope.displaying === $scope.displayingEnum.WEBSITES) {
                    clearStatisticsView();
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
            $scope.stat = {
                website: null,
                collection: null,
                test: null,
                webPages: null,
                failure: false
            };
        }
        $scope.retryUpdate = function(event) {
            event.preventDefault();
            getWebsites();
        }
        $scope.updateWebsites = function() {
            clearStatisticsView();
            getWebsites();
        };
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
        $scope.webPagesType = {
            TEST: 0,
            ALL: 1
        };
        var webPagesType = [
            function(test) {
                return getApiUrl() + 'test/' + test.Id;
            },
            function(website) {
                return getApiUrl() + website.Id + '/webpages';
            }
        ];
        $scope.getWebPages = function(event, type, parent) {
            event.preventDefault();
            if (!webPagesType[type]) {
                $scope.hints.stat = "Undefined error";
                return;
            }
            if (type === $scope.webPagesType.ALL) {
                $scope.stat.website = parent;
                stat.websites = $scope.stat.collection;
                $scope.stat.collection = null;
            }
            $scope.hints.stat = "Retrieving Web Pages...";
            gettingData = true;
            $http.get(webPagesType[type](parent)).then(
                processResponse, processResponse
            );
            function processResponse(response) {
                if (~~(response.status / 100) === 2) {
                    switch (type) {
                        case $scope.webPagesType.TEST:
                            var test = parent;
                            $scope.stat.test = test;
                            stat.tests = $scope.stat.collection;
                            $scope.stat.webPages = response.data.WebPages;
                            $scope.displaying = $scope.displayingEnum.WEBPAGES;
                            break;

                        case $scope.webPagesType.ALL:
                            var website = parent;
                            $scope.stat.website = stat.website = website;
                            $scope.stat.webPages = response.data.WebPages;
                            $scope.displaying = $scope.displayingEnum.ALL_WEBPAGES;
                    }
                    
                    $scope.hints.stat = '';
                } else {
                    $scope.hints.stat = "Failed To Retrieve Web Pages";
                    if (type === $scope.webPagesType.ALL) {
                        $scope.stat.website = parent;
                        $scope.stat.collection = stat.websites;
                    }
                }
                gettingData = false;
            }
        };
        $scope.getAllWebPages = function (event, website) {
            
        }
        var downloadWrapper = {
            header: [
                '<html>' +
                '<head>' +
                ' <style>\n' +
                '   button {\n' +
                '       display: none;\n' +
                '   }\n' +
                '    table {\n' +
                '        border-collapse: collapse;\n' +
                '    }\n' +
                '        table td, table th {\n' +
                '            border: 1px solid black;\n' +
                '            padding: 0.2rem;\n' +
                '        }\n' +
                '        .header {\n' +
                '            letter-spacing: 0.1rem;\n' +
                '            text-align: center;\n' +
                '            font-size: 3rem;\n' +
                '            font-weight: 600;\n' +
                '            text-transform: uppercase;\n' +
                '        }\n' +
                '        .signature {\n' +
                '            text-align: right;\n' +
                '            font-weight: 500;\n' +
                '            padding-top: 30px;\n' +
                '            font-size: 1.5rem;\n' +
                '            font-style: oblique;\n' +
                '            letter-spacing: 0.15rem;\n' +
                '        }\n' +
                '    .center {\n' +
                '        text-align: center;\n' +
                '        font-size: 2rem;\n' +
                '        letter-spacing: 0.15rem;\n' +
                '        padding: 20px 0;\n' +
                '    }\n' +
                '</style>' +
                '</head>' +
                '<body>' +
                '<h1 class="header">Report: ',
                '</h1>'
            ],
            footer: [
                '<div class="signature">',
                '</div>' +
                '</body>' +
                '</html>'
            ]
        }
        $scope.download = function (event) {
            event.preventDefault();
            var view = $scope.currentView;
            var content = downloadWrapper.header[0];
            switch (view) {
                case $scope.views.STAT:
                    $scope.hints.stat = "Preparing your file...";
                    switch ($scope.displaying) {
                        case $scope.displayingEnum.TESTS:
                            content += 'all tests of ' +
                                $scope.stat.website.Name +
                                downloadWrapper.header[1] +
                                '<table>' + $('#statTests').html() + '</table>';
                            break;
                        case $scope.displayingEnum.WEBPAGES:
                            content += 'test of ' + $scope.stat.website.Name +
                                downloadWrapper.header[1] +
                                $('#statTest').html() +
                                '<h1 class="center">Web Pages</h1>' +
                                '<table>' + $('#statWebPages').html().replace(/<button.*>.*<button\/>/, '') + '</table>';
                            break;
                        case $scope.displayingEnum.ALL_WEBPAGES:
                            content += 'all web pages of ' + $scope.stat.website.Name +
                                downloadWrapper.header[1] +
                                '<table>' + $('#statWebPages').html().replace(/<button.*>.*<button\/>/, '') + '</table>';
                            break;
                    }
                    break;

                case $scope.views.TEST:
                    $scope.hints.test = "Preparing your file...";
                    content += 'test result of ' +
                        $scope.result.test.WebsiteName +
                        downloadWrapper.header[1] +
                        $('#resultTest').html();
                    var table = $('#resultWebPages');
                    if (table.length && table.find('td').length) {
                        content += '<h1 class="center">Web Pages</h1>' +'<table>' +
                        table.html() +
                        '</table>';
                    }
                    break;
            }
            var now = new Date;
            content += downloadWrapper.footer[0] +
                [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/') +
                ' ' +
                [now.getHours(), now.getMinutes(), now.getSeconds()].join(':') +
                downloadWrapper.footer[1];
            saveAs(new Blob([content], { type: "text/plain;charset=utf-8" }), 'report.html');
            $scope.hints.stat = "";
            $scope.hints.test = "";
        };
        $scope.goBack = function (event) {
            event.preventDefault();
            if ($scope.displaying === $scope.displayingEnum.TESTS ||
                $scope.displaying === $scope.displayingEnum.ALL_WEBPAGES) {
                $scope.stat.collection = stat.websites;
                $scope.stat.website = null;
                if ($scope.displaying === $scope.displayingEnum.ALL_WEBPAGES) {
                    $scope.stat.webPages = '';
                }
                $scope.displaying = $scope.displayingEnum.WEBSITES;
            } else if ($scope.displaying === $scope.displayingEnum.WEBPAGES) {
                $scope.stat.test = '';
                $scope.stat.collection = stat.tests;
                $scope.stat.webPages = '';
                $scope.displaying = $scope.displayingEnum.TESTS;
            }
        }
    });