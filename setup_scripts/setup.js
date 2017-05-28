var args = require('optimist').argv;
var MsRest = require('ms-rest-azure');
var AzureServiceClient = MsRest.AzureServiceClient;
var provisioner = require('./resourceProvisioner');

// argument validation
if (!args.appId) {
    console.log("Please provide an spn id");
    return;
}
else if (!args.secret) {
    console.log("Please provide an spn secret");
    return;
}
else if (!args.tenantId) {
    console.log("Please provide a tenantId");
    return;
}
else if (!args.subscriptionId) {
    console.log("Please provide a subscriptionId");
    return;
}
else if (!args.location) {
    console.log("Please provide a location");
    return;
}
else if (!args.resourceGroup) {
    console.log("Please provide a resource group name");
    return;
}

// login
MsRest.loginWithServicePrincipalSecret(
    args.appId,
    args.secret,
    args.tenantId,
    (err, credentials) => {
        if (err) throw err
        
        provisioner.init(credentials, args.subscriptionId);
        
        // create or update resource group
        provisioner.createResourceGroup(args.resourceGroup, args.location, () => {
            // provision Storage Account
            provisioner.createStorageAccount(args.location, args.resourceGroup, (storageObject) => {
                provisioner.createAzureSearch(args.subscriptionId, args.location, args.resourceGroup, (searchResponse) => {
                    // create images index
                    provisioner.createSearchIndex(searchResponse.url, searchResponse.adminKey, () => {
                        // create Vision Service
                        provisioner.createVisionCognitiveService(args.resourceGroup, args.location, function (visionKey) {
                            // all done, output results
                            console.log("Storage Account Name: " + storageObject.accountName);
                            console.log("Storage Account Key: " + storageObject.key);
                            console.log("");
                            console.log("Azure Search URL: " + searchResponse.url);
                            console.log("Azure Search Admin Key: " + searchResponse.adminKey);
                            console.log("");
                            console.log("Cognitive Services Key: " + visionKey);
                            console.log("");
                            console.log("Location: " + args.location.replace(" ", "").toLowerCase());
                        });
                    });
                });
            });
        });
    }
);

