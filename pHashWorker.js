'use strict';

const blockhash = require('blockhash');
const fs = require('fs');
const jpeg = require('jpeg-js');

/**
 * Calculates the perceptual hash of the given image
 * @param {string} fileName
 * @returns {Array.<string>} A "tuple" where the first entry is the image path/name, the second the perceptual hash
 * and the third entry holds any error which has occurred;
 */
const getPHash = (fileName) => {
    console.log('Processing', fileName);
    var error = '';
    const data = fs.readFileSync(fileName);
    var jpg;
    var hash = '';
    try {
        jpg =jpeg.decode(data);
    } catch(e) {
        console.log('File', fileName, 'caused an error!');
        error = e;
    }
    if (jpg) {
        hash = blockhash.blockhashData(jpg, 16, 2);
    }
    return [fileName, hash, error];
};

/**
 * Handles the message event of the process and starts to calculate perceptual hashes for all given images
 * @param {string} params The JSON encoded payload for the process, in the form of {jgps: Array.<string>}, where
 * each entries in jpgs represents an image
 */
const handleMessage = (params) => {
    const data = JSON.parse(params);
    const hashes = data.jpgs.map(getPHash);
    process.send(JSON.stringify({hashes: hashes, index: data.index}));
};

process.on('message', handleMessage);
