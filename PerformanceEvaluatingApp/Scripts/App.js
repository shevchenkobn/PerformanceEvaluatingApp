var module = angular.module('Main', []);
    module.controller('MainController',
        function ($scope, $http, $location) {
            var views = $scope.views = {
                TEST: 0,
                STAT: 1
            };
            $scope.currentView = views.TEST;
            $scope.url = 'http://www.lucapederzini.com/';
            var tests = [];
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
                $scope.result = {};
                $scope.processing = true;
                $http.post(getApiUrl(), $scope.url).then(proceedResponse, proceedResponse);

                function proceedResponse(response) {
                    debugger;
                    if (~~(response.status / 100) === 2) {
                        response.data.Timestamp = new Date(response.data.Timestamp);
                        tests.push(angular.copy(response.data));
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
                    debugger;
                    if (~~(response.status / 100) === 2) {
                        response.data.Timestamp = new Date(response.data.Timestamp);
                        $scope.result.webPages = response.data.WebPages;
                        for (var i = 0; i < $scope.result.webPages.length; i++) {
                            $scope.result.webPages[i].Timestamp = new Date($scope.result.webPages[i].Timestamp);
                        }
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
                        });
                    $scope.hints.test = "You deleted test";
                    tests.pop(); // assume that test is the last added element
                    $scope.result = {};
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
        });