'use strict';

var blockhash = require('blockhash');
var fs = require('fs');
var jpeg = require('jpeg-js');
var recursive = require('recursive-fs');
var path = require('path');
var mori = require('mori');

/**
 * Compares the file names of two vectors
 * @param {mori.vector} vectorA
 * @param {mori.vector} vectorB
 * @returns {number}
 */
var compareFileNames = function (vectorA, vectorB) {
    var fileNameA = mori.first(vectorA);
    var fileNameB = mori.first(vectorB);
    var result;
    if (fileNameA < fileNameB) {
        result = 1;
    } else if (fileNameA === fileNameB) {
        result = 0;
    } else {
        result = -1;
    }
    return result;
};

/**
 * Compares the perceptible hash of the given vector with every other hash in the array
 * @param {object} dict
 * @param {mori.vector} currentVector The vector which contains the current hash and file name
 * @param {number} index The current position in the array
 * @param {Array.<mori.vector>} array The array which contains all vectors of file name and perceptible hash
 */
var compareHashes = function (dict, currentVector, index, array) {
    array.forEach(function (innerCurrentVector, innerIndex) {
        if (index !== innerIndex) {
            var vectors = [currentVector, innerCurrentVector].sort(compareFileNames);
            var key = path.basename(mori.first(vectors[0])) + path.basename(mori.first(vectors[1]));
            if (!dict[key]) {
                dict[key] = {
                    hash: blockhash.hammingDistance(mori.last(currentVector), mori.last(innerCurrentVector)),
                    vectors: vectors
                };
            }
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
        var dict = {};
        mori.into_array(hashes).forEach(mori.partial(compareHashes, dict));
        console.log(JSON.stringify(dict));
    }
});
