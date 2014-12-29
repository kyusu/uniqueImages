'use strict';

var blockhash = require('blockhash');
var recursive = require('recursive-fs');
var path = require('path');
var Thread = require('child-manager');
var os = require('os');
var q = require('q');

var cpus = os.cpus();
var promises = [];
var deferreds = [];

/**
 * Handles the output of the thread object. Parses the output and resolves the promise associated with the given thread
 * @param {string} out The JSON encoded output of the thread. An object of the form
 * {index: number, hashes: Array.<Array.<strings>>}
 */
var handleThreadOutput = function (out) {
    var result = JSON.parse(out);
    deferreds[result.index].resolve(result.hashes);
};

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
 * Compares the hash value of two "tuples"
 * @param {Array.<string>} tupleA
 * @param {Array.<string>} tupleB
 * @returns {number}
 */
var compareHashes = function (tupleA, tupleB) {
    var hashA = tupleA[1];
    var hashB = tupleB[1];
    return compareStrings(hashA, hashB);
};

/**
 * Takes an array of sorted "tuples" and groups it by their hamming distance
 * @param {Array.<Array.<string>>} tuples
 * @returns {Array.<Array.<string>>}
 */
var groupByHammingDistance = function (tuples) {
    var groups = [[]];
    var groupIndex = 0;
    tuples.forEach(function (currentVector, index, array) {
        if (index > 0) {
            var hash = blockhash.hammingDistance(array[index - 1][1], currentVector[1]);
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
 * Whether the file extension of the given file is jpg or not
 * @param {string} fileName
 * @returns {boolean}
 */
var isJPG = function (fileName) {
    return path.extname(fileName) === '.jpg';
};

/**
 * Splits up the given array into an array which holds n arrays
 * @param {Array.<*>} array
 * @param chunks
 * @returns {Array.<Array.<*>>}
 */
var splitUpIntoChunks = function (array, chunks) {
    var size = Math.ceil(array.length / chunks);
    var splitUp = [];
    for (var i = 0; i < array.length; i += size) {
        splitUp.push(array.slice(i, i + size));
    }
    console.log('Array length:', array.length, 'chunk size:', size, 'chunks:', chunks);
    return splitUp;
};

/**
 * Handles the case that all promises are resolved. Sorts the tuple of hashes and file names and groups them by hamming
 * distance
 * @param {Array.<Array.<string>>} array
 */
var handleResolvedPromises = function (array) {
    thread.close();
    var hashes = [].concat.apply([], array);
    var sortedTuples = hashes.sort(compareHashes);
    var grouped = groupByHammingDistance(sortedTuples);
    var groups = (grouped.filter(function (group) {
        return group.length > 1;
    })).map(function (group) {
            return group.map(function (tuple) {
                return path.basename(tuple[0]);
            });
        });
    console.log(JSON.stringify(groups));
    console.timeEnd('Hashing');
};

/**
 * @param {string} error
 * @param {Array.<string>} dirs
 * @param {Array.<string>} files
 */
var handleReadDirectory = function (error, dirs, files) {
    if (error) {
        console.log(error);
    } else {
        console.time('Hashing');
        var jpgs = files.filter(isJPG, files);
        var splitJpgs = splitUpIntoChunks(jpgs, cpus.length);
        splitJpgs.forEach(function (value, index) {
            var deferred = q.defer();
            console.log(index);
            thread.execute(JSON.stringify({index: index, jpgs: value}));
            deferreds.push(deferred);
            promises.push(deferred.promise);
        });
        q.all(promises).then(handleResolvedPromises).done();
    }
};

var root = path.resolve(process.argv[2]);
var thread = new Thread('./worker.js', handleThreadOutput, cpus.length);
recursive.readdirr(root, handleReadDirectory);
