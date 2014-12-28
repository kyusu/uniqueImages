'use strict';

var blockhash = require('blockhash');
var fs = require('fs');
var jpeg = require('jpeg-js');
var recursive = require('recursive-fs');
var path = require('path');
var mori = require('mori');

/**
 * Compares two strings
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
var compareStrings = function (a, b) {
    var result;
    if (a < b) {
        result = 1;
    } else if (a === b) {
        result = 0;
    } else {
        result = -1;
    }
    return result;
};

/**
 * Compares the hash value of two vectors
 * @param {mori.vector} vectorA
 * @param {mori.vector} vectorB
 * @returns {number}
 */
var compareHashes = function (vectorA, vectorB) {
    var hashA = mori.last(vectorA);
    var hashB = mori.last(vectorB);
    return compareStrings(hashA, hashB);
};

/**
 * Takes an array of sorted vectors and groups it by their hamming distance
 * @param {Array.<mori.vector>} vectors
 * @returns {Array.<Array.<mori.vector>>}
 */
var groupByHammingDistance = function (vectors) {
    var groups = [[]];
    var groupIndex = 0;
    vectors.forEach(function (currentVector, index, array) {
        if (index > 0) {
            var hash = blockhash.hammingDistance(mori.last(array[index - 1]), mori.last(currentVector));
            if (hash < 10) {
                groups[groupIndex].push(currentVector);
            } else {
                groups.push([currentVector]);
                groupIndex++;
            }
        } else {
            groups[groupIndex].push(currentVector);
        }
    });
    return groups;
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
        var sortedVectors = mori.into_array(hashes).sort(compareHashes);
        var grouped = groupByHammingDistance(sortedVectors);
        var groups = (grouped.filter(function (group) {
            return group.length > 1;
        })).map(function (group) {
            return group.map(function (vector) {
                return path.basename(mori.first(vector));
            });
        });
        console.log(JSON.stringify(groups));
    }
});
