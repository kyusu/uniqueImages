'use strict';

const md5File = require('md5-file/promise');

/**
 * Returns a "tuple" containing the name/path and md5 hash of the given file
 * @param {string} fileName
 * @returns {Promise.<Array.<string>>}
 */
const getMd5 = fileName => md5File(fileName).then(hash => [fileName, hash]);

/**
 * Handles the message event of the process and starts to calculate md5 hashes for all given images
 * @param {string} params The JSON encoded payload for the process, in the form of {jgps: Array.<string>}, where
 * each entries in jpgs represents an image
 */
const handleMessage = (params) => {
    const data = JSON.parse(params);
    const promises = data.jpgs.map(getMd5);
    Promise.all(promises).then(hashes => process.send(JSON.stringify({
        hashes: hashes,
        index: data.index
    })));
};

process.on('message', handleMessage);
