'use strict';

const beautify = require('js-beautify').js_beautify;
const uniqueImages = require('./uniqueImages.js');
const app = require('./uniqueImagesUi/bin/www.js');


uniqueImages.findDuplicates(process.argv[2]).then(app.startServer);







