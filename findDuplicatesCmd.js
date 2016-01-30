'use strict';

const beautify = require('js-beautify').js_beautify;
const uniqueImages = require('./uniqueImages.js');

uniqueImages.findDuplicates(process.argv[2]).then((results) => {
    console.log('Duplicates:', beautify(JSON.stringify(results.duplicates)));
    console.log('Potential duplicates:', beautify(JSON.stringify(results.potentialDuplicates)));
    console.log('Files which have caused errors', beautify(JSON.stringify(results.brokenFiles)));
});
