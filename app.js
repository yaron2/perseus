var express = require('express');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var Photos = require('./modules/photos.module');
var cors = require('cors');
var app = express();

app.use(express.static(__dirname));
app.use(cors());

if (!process.env.storageAccountName) {
    console.log("Please provide a Storage Account Name");
    return;
}
else if (!process.env.storageAccountKey) {
    console.log("Please provide a Storage Account Key");
    return;
}
else if (!process.env.azureSearchUrl) {
    console.log("Please provide an Azure Search URL");
    return;
}
else if (!process.env.azureSearchKey) {
    console.log("Please provide an Azure Search Service Query Key");
    return;
}
else if (!process.env.location) {
    console.log("Please provide a location");
    return;
}
else if (!process.env.visionApiKey) {
    console.log("Please provide a Cognitive Services Vision API Key");
    return;
}

Photos. init(process.env.azureSearchUrl, process.env.azureSearchKey, process.env.storageAccountName, process.env.storageAccountKey, process.env.visionApiKey, process.env.location);

app.post('/photos/upload', upload.array('photos'), function (req, res, next) {
    Photos.upload(req.files, (response) => {
        res.json(response);
    });
});

app.post('/photos/search', upload.single('photo'), function (req, res, next) {
    Photos.search(req.file, (response) => {
        res.json(response);
    });
});

app.get('/photos/searchText', function (req, res, next) {
    Photos.searchText(req.query.query, (response) => {
        res.json(response);
    });
});

app.get('/photos', function(req, res) {
    Photos.get((response) => {
        res.json(response);
    });
});

app.delete('/photos', function(req, res) {
    Photos.deleteAll((response) => {
        res.json(response);
    });
});

app.get('/', function(req, res) {
    res.sendFile('/site/dist/index.html', { root: __dirname });
});

app.get('/status', function(req, res) {
    res.status(200).send("Perseus status: Running");
});

app.listen(process.env.PORT || 3030);
console.log("Perseus is running");