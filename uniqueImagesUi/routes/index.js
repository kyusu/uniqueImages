'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');

router.get(/\/img\/.*/, function (req, res, next) {
    var file = decodeURI(req.url).replace('/img', '');
    console.log(file);
    res.sendFile(file);
});

/* GET home page. */
router.get('/', function (req, res, next) {
    const results = req.app.get('uniqueImagesResults');
    res.render('index', {
        potentialDuplicates: results.potentialDuplicates,
        duplicates: results.duplicates
    });
});

module.exports = router;
