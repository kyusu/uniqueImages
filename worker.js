'use strict';

var blockhash = require('blockhash');
var fs = require('fs');
var jpeg = require('jpeg-js');

/**
 * Calculates the perceptible hash of the given file
 * @param fileName
 * @returns {Array.<string>} A "tuple" where the first entry is the file name and the second the perceptible hash
 */
var getPHash = function (fileName) {
    var data = fs.readFileSync(fileName);
    var hash = blockhash.blockhashData(jpeg.decode(data), 16, 2);
    return [fileName, hash];
};
process.on('message', function (params) {
    var data = JSON.parse(params);
    var hashes = data.jpgs.map(getPHash);
    process.send(JSON.stringify({hashes: hashes, index: data.index}));
});
