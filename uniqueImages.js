'use strict';

var blockhash = require('blockhash');
var fs = require('fs');
var jpeg = require('jpeg-js');
var recursive = require('recursive-fs');
var path = require('path');
var mori = require('mori');

/**
 * Compares the perceptible hash of the given vector with every other hash in the array
 * @param {mori.vector} currentVector The vector which contains the current hash and file name
 * @param {number} index The current position in the array
 * @param {Array.<mori.vector>} array The array which contains all vectors of file name and perceptible hash
 */
var compareHashes = function (currentVector, index, array) {
    array.forEach(function (innerCurrentVector, innerIndex) {
        if (index !== innerIndex) {
            var hammingDistance = blockhash.hammingDistance(mori.last(currentVector), mori.last(innerCurrentVector));
            console.log(path.basename(mori.first(currentVector)), path.basename(mori.first(innerCurrentVector)), hammingDistance);
        }
    });
};

/**
 * Calculates the perceptible hash of the given file
 * @param fileName
 * @returns {mori.vector} A mori vector where the first entry is the file name and the second the perceptible hash
 */
var getPHash = function (fileName) {
    var data = fs.readFileSync(fileName);
    var hash = blockhash.blockhashData(jpeg.decode(data), 16, 2);
    return mori.vector(fileName, hash);
};

/**
 * Whether the file extension of the given file is jpg or not
 * @param {string} fileName
 * @returns {boolean}
 */
var isJPG = function (fileName) {
    return path.extname(fileName) === '.jpg';
};

var root = path.resolve(process.argv[2]);

recursive.readdirr(root, function (err, dirs, files) {
    if (err) {
        console.log(err);
    } else {
        var jpgs = mori.filter(isJPG, files);
        var hashes = mori.map(getPHash, jpgs);
        mori.into_array(hashes).forEach(compareHashes);
    }
});
