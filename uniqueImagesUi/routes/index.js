'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const getFilePath = url => decodeURI(url).replace('/img', '');

router.get(/\/img\/.*/,  (req, res, next) => {
    res.sendFile(getFilePath(req.url));
});

router['delete'](/\/img\/.*/, (req, res, next) => {
    fs.unlink(getFilePath(req.url), err => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

/* GET home page. */
router.get('/', (req, res, next) => {
    const results = req.app.get('uniqueImagesResults');
    res.render('index', {
        potentialDuplicates: results.potentialDuplicates,
        duplicates: results.duplicates
    });
});

module.exports = router;
