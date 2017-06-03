var Photos = function () {
    var Storage = require('azure-storage');
    var AzureSearch = require('azure-search');
    var streamifier = require('streamifier');
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var async = require('async');
    var shortid = require('shortid');
    var pos = require('pos');

    var storageAccountName, storageAccountKey, searchClient, computerVision, visionKey, visionApiUrl;

    function init(searchUrl, searchAdminKey, saName, saKey, visionApiKey, location) {
        storageAccountName = saName;
        storageAccountKey = saKey;

        searchClient = AzureSearch({
            url: searchUrl,
            key: searchAdminKey
        });

        visionKey = visionApiKey;
        visionApiUrl = "https://" + location + ".api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Categories,Tags,Description&language=en";
    }

    function upload(photos, callback) {
        let blobService = Storage.createBlobService(storageAccountName, storageAccountKey);
        blobService.createContainerIfNotExists("photos", { publicAccessLevel: 'blob' }, function (err, result) {
            let images = [];

            let tasks = [];
            photos.forEach((photo) => {
                tasks.push(function (handler) {
                    let stream = streamifier.createReadStream(photo.buffer);
                    blobService.createBlockBlobFromStream("photos", photo.originalname, stream, photo.size, { contentSettings: { contentType: photo.mimetype } }, function (error, result, response) {
                        images.push(getImageUrl(result.name));
                        handler();
                    });
                });
            });

            async.parallel(tasks, () => {
                extractMetadataFromPhotos(images, (metadata) => {
                    writeMetadataToSearch(metadata, (metadataResponse) => {
                        callback(metadataResponse);
                    });
                });
            });
        });
    }

    function writeMetadataToSearch(metadata, callback) {
        searchClient.addDocuments("images", metadata, function (err, results) {
            if (err)
                callback({ status: 'error', errorMessage: 'Failed adding metadata to search' });
            else {
                callback({ status: 'ok' });
            }
        });
    }

    function extractMetadataFromPhotos(photos, callback) {
        let results = [];
        let tasks = [];
        // TODO: Parallelize based on the Cognitive Services tier to not get throttled

        photos.forEach((photoUrl) => {
            tasks.push(function (handler) {
                extractMetadataFromPhoto(photoUrl, (response) => {
                    if (response.status == "ok") {
                        results.push({
                            id: shortid.generate(),
                            url: photoUrl,
                            categories: response.features.categories,
                            captions: response.features.captions,
                            tags: response.features.tags
                        });

                        handler();
                    }
                });
            });
        });

        async.series(tasks, (result) => {
            callback(results);
        });
    }

    function extractMetadataFromPhoto(photoUrl, callback) {
        let args = {
            data: { url: photoUrl },
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": visionKey
            }
        };

        let features = {
            categories: [],
            tags: [],
            captions: []
        }

        client.post(visionApiUrl, args, function (data, respone) {
            data.categories.forEach((category) => {
                features.categories.push(category.name);
            });

            data.tags.forEach((tag) => {
                features.tags.push(tag.name);
            });

            data.description.captions.forEach((caption) => {
                features.captions.push(caption.text);
            });

            callback({ status: 'ok', features: features });
        });
    }

    function getImageUrl(imageName, isTemp) {
        var containerName = "photos";

        if (isTemp)
            containerName = "temp";

        return "https://" + storageAccountName + ".blob.core.windows.net/" + containerName + "/" + imageName;
    }

    function get(callback) {
        searchClient.search("images", { search: "*", top: 1000 }, function (err, results) {
            if (err)
                callback({ status: 'error', errorMessage: 'Search operation failed' });
            else {
                let response = buildResponse(results);
                callback({ status: 'ok', items: response });
            }
        });
    }

    function buildResponse(results, minimumScore = 0) {
        let items = [];

        for (let r in results) {
            let item = results[r];
            if (item['@search.score'] > minimumScore)
                items.push({
                    score: item['@search.score'],
                    tags: item.tags,
                    categories: item.categories,
                    captions: item.captions,
                    url: item.url
                });
        }

        return items;
    }

    function search(photo, callback) {
        let stream = streamifier.createReadStream(photo.buffer);
        let blobService = Storage.createBlobService(storageAccountName, storageAccountKey);

        blobService.createContainerIfNotExists("temp", { publicAccessLevel: 'blob' }, function (err, result) {
            blobService.createBlockBlobFromStream("temp", photo.originalname, stream, photo.size, function (error, result, response) {
                let photoUrl = getImageUrl(result.name, true);

                extractMetadataFromPhoto(photoUrl, (metadata) => {
                    searchClient.search("images", { search: metadata.features.tags.join(" ") + " " + metadata.features.captions.join(" ") + " " + metadata.features.categories.join(" ") }, function (err, results) {
                        if (err)
                            callback({ status: 'error', errorMessage: 'Search operation failed' });
                        else {
                            let response = buildResponse(results, 0.05);
                            callback({ status: 'ok', items: response });
                        }
                    });
                });
            });
        });
    }

    function searchText(query, callback) {
        if (!query) {
            callback({ status: 'error', errorMessage: 'query cannot be empty' });
            return;
        }
        
        searchClient.search("images", { search: query }, function (err, results) {
            if (err)
                callback({ status: 'error', errorMessage: 'Search operation failed' });
            else {
                let response = buildResponse(results, 0.05);
                callback({ status: 'ok', items: response });
            }
        });
    }

    return {
        searchText: searchText,
        init: init,
        upload: upload,
        get: get,
        search: search
    }
}();

module.exports = Photos;