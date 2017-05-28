var ResourceProvisioner = function () {
    var storageManagementClient = require('azure-arm-storage');
    var resourceManagement = require("azure-arm-resource");
    var SearchManagement = require("azure-arm-search");
    var AzureSearch = require('azure-search');
    var Storage = require('azure-storage');
    var CognitiveServices = require('azure-arm-cognitiveservices');
    var credentials;
    var subscriptionId;

    function init(creds, subscriptionID) {
        credentials = creds;
        subscriptionId = subscriptionID;
    }

    function createResourceGroup(resourceGroup, location, callback) {
        let client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);

        let groupParameters = {
            location: location
        };

        client.resourceGroups.createOrUpdate(resourceGroup, groupParameters, function (err, result, request, response) {
            if (err) {
                throw err;
            } else {
                callback(true);
            }
        });
    }

    function createVisionCognitiveService(resourceGroup, location, callback) {
        let obj = {
            sku: {
                name: "S1"
            },
            kind: "ComputerVision",
            location: location,
            properties: {}
        }

        let client = new CognitiveServices(credentials, subscriptionId);
        let name = "visionService" + getRandomNumber(1000, 9999);

        client.cognitiveServicesAccounts.create(resourceGroup, name, obj, function (err, result, request, response) {
            if (err)
                throw err;

            client.cognitiveServicesAccounts.listKeys(resourceGroup, name, function (err, result, request, response) {
                if (err)
                    throw err;

                callback(result.key1);
            });
        });
    }

    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function createSearchIndex(azureSearchUrl, azureSearchKey, callback) {
        let client = AzureSearch({
            url: azureSearchUrl,
            key: azureSearchKey
        });

        let index = {
            name: "images",
            fields: [
                {
                    name: "id",
                    type: 'Edm.String',
                    searchable: false,
                    filterable: true,
                    retrievable: true,
                    sortable: false,
                    facetable: false,
                    key: true
                },
                {
                    name: "url",
                    type: 'Edm.String',
                    searchable: false,
                    filterable: false,
                    retrievable: true,
                    sortable: false,
                    facetable: false,
                    key: false
                },
                {
                    name: "categories",
                    type: "Collection(Edm.String)",
                    searchable: true,
                    filterable: false,
                    sortable: false,
                    facetable: false,
                    key: false,
                    retrievable: true
                },
                {
                    name: "tags",
                    type: "Collection(Edm.String)",
                    searchable: true,
                    filterable: false,
                    sortable: false,
                    facetable: false,
                    key: false,
                    retrievable: true
                },
                {
                    name: "captions",
                    type: "Collection(Edm.String)",
                    searchable: true,
                    filterable: false,
                    sortable: false,
                    facetable: false,
                    key: false,
                    retrievable: true
                }
            ]
        }

        client.createIndex(index, (err, response) => {
            if (err)
                throw err;

            callback(true);
        });
    }

    function createAzureSearch(subscriptionId, location, resourceGroup, callback) {
        let client = new SearchManagement(credentials, subscriptionId);

        let searchServiceName = "perseussearch" + getRandomNumber(1000, 9999);

        let obj = {
            sku: {
                name: "basic"
            },
            properties: {
                replicaCount: 1,
                partitionCount: 1,
                hostingMode: "default"
            },
            location: location
        }

        client.services.createOrUpdate(resourceGroup, searchServiceName, obj, function (err, result, request, response) {
            if (err)
                throw err;
                
            client.adminKeys.get(resourceGroup, searchServiceName, function (err, result, request, response) {
                if (err)
                    throw err;

                callback({
                    url: "https://" + searchServiceName + ".search.windows.net",
                    adminKey: result.primaryKey
                });
            });
        });
    }

    function createStorageAccount(location, resourceGroup, callback) {
        let client = new storageManagementClient(credentials, subscriptionId);

        let createParameters = {
            location: location,
            sku: {
                name: 'Standard_LRS'
            },
            kind: 'Storage'
        };

        let accountName = "perseusstaccount" + getRandomNumber(1000, 9999);

        client.storageAccounts.create(resourceGroup, accountName, createParameters, function (err, result, request, response) {
            if (err) {
                throw err;
            }

            client.storageAccounts.listKeys(resourceGroup, accountName, function (err, result, request, response) {
                let obj = {
                    accountName: accountName,
                    key: result.keys[0].value
                }

                let blobService = Storage.createBlobService(obj.accountName, obj.key);
                blobService.createContainerIfNotExists("photos", { publicAccessLevel: 'blob' }, function (err, result) {
                    if (err)
                        throw err;

                    callback(obj);
                });
            });
        });
    }

    return {
        init: init,
        createVisionCognitiveService: createVisionCognitiveService,
        createSearchIndex: createSearchIndex,
        createAzureSearch: createAzureSearch,
        createResourceGroup: createResourceGroup,
        createStorageAccount: createStorageAccount
    }
}();

module.exports = ResourceProvisioner;