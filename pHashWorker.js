'use strict';

var blockhash = require('blockhash');
var fs = require('fs');
var jpeg = require('jpeg-js');

/**
 * Calculates the perceptual hash of the given image
 * @param {string} fileName
 * @returns {Array.<string>} A "tuple" where the first entry is the image path/name and the second the perceptual hash
 */
var getPHash = function (fileName) {
    var data = fs.readFileSync(fileName);
    var hash = blockhash.blockhashData(jpeg.decode(data), 16, 2);
    return [fileName, hash];
};

/**
 * Handles the message event of the process and starts to calculate perceptual hashes for all given images
 * @param {string} params The JSON encoded payload for the process, in the form of {jgps: Array.<string>}, where
 * each entries in jpgs represents an image
 */
var handleMessage = function (params) {
    var data = JSON.parse(params);
    var hashes = data.jpgs.map(getPHash);
    process.send(JSON.stringify({hashes: hashes, index: data.index}));
};

process.on('message', handleMessage);
