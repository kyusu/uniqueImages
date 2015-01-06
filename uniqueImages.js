'use strict';

var blockhash = require('blockhash');
var recursive = require('recursive-fs');
var path = require('path');
var Thread = require('child-manager');
var os = require('os');
var q = require('q');
var beautify = require('js-beautify').js_beautify;

var cpus = os.cpus();

/**
 * Handles the output of a thread object. Parses the output and resolves the promise associated with the given thread
 * @param {Array.<q>} deferreds
 * @param {string} out The JSON encoded output of the thread. An object of the form
 * {index: number, hashes: Array.<Array.<strings>>}
 */
var handleThreadOutput = function (deferreds, out) {
    var result = JSON.parse(out);
    var promise = deferreds[result.index];
    if (promise) {
        promise.resolve(result.hashes);
    }
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
 * Checks if the hamming distance of the two given hashes is a below a threshold
 * @param {string} hash1
 * @param {string} hash2
 * @returns {boolean}
 */
var hammingDistanceSmallEnough = function (hash1, hash2) {
    var distance = blockhash.hammingDistance(hash1, hash2);
    return distance < 10;
};

/**
 * Takes an array of sorted "tuples" and groups them by similarity
 * @param {function} predicate A function which acts as a predicate whether two hashes can be considered similar enough
 * to be grouped together
 * @param {Array.<Array.<string>>} tuples
 * @returns {Array.<Array.<string>>}
 */
var groupBySimilarity = function (predicate, tuples) {
    var groups = [[]];
    var groupIndex = 0;
    tuples.forEach(function (currentVector, index, array) {
        if (index > 0) {
            var similarEnough = predicate(array[index - 1][1], currentVector[1]);
            if (similarEnough) {
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

var handleMd5PromisesResolved = function (md5Obj, array) {
    md5Obj.thread.close();
    var hashes = [].concat.apply([], array);
    var sortedTuples = hashes.sort(compareHashes);
    var grouped = groupBySimilarity(function (hash1, hash2) {
        return hash1 === hash2;
    }, sortedTuples);
    var groups = grouped.map(function (group) {
        return group.map(function (tuple) {
            return tuple[0];
        }).sort();
    });
    console.log('Duplicates:', beautify(JSON.stringify(groups.filter(function (group) {
        return group.length > 1;
    }).map(function (group) {
        return group.map(function (file) {
            return path.basename(file);
        });
    }))));
    calculateHashes(groups.map(function (group) {
        return group[0];
    }), pHash);
};

/**
 *
 * @param {Array.<string>} jpgs
 * @param {{thread: Thread, deferred: Array, promises: Array, deferred: Array, handleResolved: function}} hashObj
 */
var calculateHashes = function (jpgs, hashObj) {
    var splitJpgs = splitUpIntoChunks(jpgs, cpus.length);
    splitJpgs.forEach(function (value, index) {
        var deferred = q.defer();
        hashObj.thread.execute(JSON.stringify({index: index, jpgs: value}));
        hashObj.deferreds.push(deferred);
        hashObj.promises.push(deferred.promise);
    });
    q.all(hashObj.promises).then(hashObj.handleResolved.bind(undefined, hashObj)).done();
};

/**
 * Handles the case that all promises are resolved. Sorts the tuple of hashes and file names and groups them by hamming
 * distance
 * @param {{}} pHashObj
 * @param {Array.<Array.<string>>} array
 */
var handlePHashPromisesResolved = function (pHashObj, array) {
    pHashObj.thread.close();
    var hashes = [].concat.apply([], array);
    var sortedTuples = hashes.sort(compareHashes);
    var grouped = groupBySimilarity(hammingDistanceSmallEnough, sortedTuples);
    var groups = (grouped.filter(function (group) {
        return group.length > 1;
    })).map(function (group) {
            return group.map(function (tuple) {
                return path.basename(tuple[0]);
            }).sort();
        });
    console.log('Potential duplicates:', beautify(JSON.stringify(groups)));
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
        calculateHashes(jpgs, md5);
    }
};

var md5 = {
    promises: [], deferreds: [], handleResolved: handleMd5PromisesResolved
};
md5.thread = new Thread('./md5Worker.js', handleThreadOutput.bind(undefined, md5.deferreds), cpus.length);

var pHash = {
    promises: [], deferreds: [], handleResolved: handlePHashPromisesResolved
};
pHash.thread = new Thread('./pHashWorker.js', handleThreadOutput.bind(undefined, pHash.deferreds), cpus.length);

var rootDir = path.resolve(process.argv[2]);
recursive.readdirr(rootDir, handleReadDirectory);
