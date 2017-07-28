# Perseus
Perseus is an image search blackbox built using Azure Cognitive Services, Azure Search and Node.js.
Using Perseus you can create a photo data lake by uploading assets and perform similarity search done against other photos, search through your repository using natural language.

Perseus exposes a RESTful API and a Web UI dashboard.

## Setting up
Perseus will create all Azure resources for you, including the Azure Cognitive Service, Blob Storage and Azure Search.
A custom index will also be created for the images metadata.

To setup Perseus, run setup.js in setup_scripts using the following parameters:

```
node ./setup_scripts/setup.js --appId={Azure Active Directory App ID} --secret={Azure Active Directory App Secret} --tenantId={Azure AD Tenant ID --subscriptionId={Your Subscription ID} --resourceGroup={Name of ResourceGroup} --location={Location to setup in. Example: West Europe}
```

After the setup finishes, you will receive the following outputs: Storage Account Name, Storage Account Key, Azure Search URL, Azure Search Key, Vision API Key.

## Getting started

Perseus expects the following environment variables to be set -

1) storageAccountName - Name of Storage Account
2) storageAccountKey - Storage Account Key
3) azureSearchUrl - URL of Azure Search instance
4) azureSearchKey - Admin Key of Azure Search instance
5) visionApiKey - Azure Cognitive Services Vision API key
6) location - The deployment location. Example: westeurope
7) PORT (optional) - The port to listen on. Defaults to 3030

Start Perseus:

```
node app.js
```

Thats it. You can now reach Perseus on your browser and via the API. (localhost:3030)

### Running in Docker

Perseus can easily run inside a Docker container. Just build the image using the Dockerfile and run:

```

docker run -d -p 3030:3030 -e "storageAccountName=xxxxxx" -e "storageAccountKey=xxxxxx" -e "azureSearchUrl=xxxxxx" -e "azureSearchKey=xxxxxx" -e "visionApiKey=xxxxxx" -e "location=westeurope" yourrepository/yourimage
```

A ready made Docker image is available at [yaron2/perseus].

[yaron2/perseus]: https://hub.docker.com/r/yaron2/perseus/