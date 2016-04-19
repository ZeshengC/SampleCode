//todo: create a new module for customer file upload
//todo: include inputfile.css in css bundle
appMainModule.controller("CustomerFileViewModel", function ($scope, $http,$modal, $location, viewModelHelper, validator) {
    $scope.viewModelHelper = viewModelHelper;
    $scope.customerFileModel = new TrustFund.CustomerFileModel();
    $scope.files = [];

    var getUploadedFiles = function () {
        viewModelHelper.apiGet("api/customer/uploadedFiles", null, function (result) {
            
            angular.forEach(result.data, function (file) {
                file.UploadDate = new Date(file.UploadDate).toLocaleString(); //parse date data to readable format.
            });
            $scope.files = result.data;
        });
    }
    getUploadedFiles();

    $scope.animationEnabled = true;
    $scope.open = function () {
        var modalInstance = $modal.open({
            animation: $scope.animationEnabled,
            templateUrl: 'uploadFile.html',
            controller: 'uploadFileModalCtrl',
            size: 'lg',
            resolve: {
                items: function () {
                    return $scope.files;
                }
            }
        });
    };
    $scope.download = function (path) {
        console.log(path);
        window.open(path, "_blank");
    };
});

appMainModule.controller('uploadFileModalCtrl', function ($scope, $modalInstance, items) {
    $scope.items = items;
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

});

//manipulate the upload file template
appMainModule.directive('uploadFile', function () {
    return {
        // Restrict it to be an attribute in this case
        restrict: 'A',
        // responsible for registering DOM listeners as well as updating the DOM
        link: function (scope, element, attrs) {
            $(element).fileinput(scope.$eval(attrs.uploadFile));
        },
        controller: function ($scope, $element, $attrs) {
            $($element).on('fileuploaded', function (event, data, previewId, index) {
                var response = data.response;
                response.UploadDate = new Date(response.UploadDate).toLocaleString(); //parse date to readable format. 
                $scope.addOrUpdate(response);
                $scope.$apply();
            });
            
            $scope.addOrUpdate = function (file) {
                var exists = false;
                angular.forEach($scope.items, function (item,index,theArray) {
                    if(!exists)
                    {
                        if(item.FileName == file.FileName)
                        {
                            $scope.items[index] = file;
                            exists = true;
                        }
                    }
                });
                if(!exists)
                {
                    $scope.items.push(file);
                }
                $scope.$apply();
            };
        }
    };
});