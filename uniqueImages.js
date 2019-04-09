'use strict';

const blockHash = require('blockhash');
const recursive = require('recursive-fs');
const path = require('path');
const Thread = require('child-manager');
const os = require('os');
const q = require('q');
const R = require('ramda');

var results = {};
const resultDeferred = q.defer();

/**
 * Handles the output of a thread object. Parses the output and resolves the promise associated with the given thread
 * @param {Array.<q>} deferreds
 * @param {string} out The JSON encoded output of the thread. An object of the form
 * {index: number, hashes: Array.<Array.<strings>>}
 */
const handleThreadOutput = (deferreds, out) => {
    const result = JSON.parse(out);
    var promise = deferreds[result.index];
    if (promise) {
        promise.resolve(result.hashes);
    }
};

/**
 * Compares the hash value of two "tuples"
 * @param {Array.<string>} tupleA
 * @param {Array.<string>} tupleB
 * @returns {number}
 */
const compareHashes = R.comparator(([, a], [, b]) => a > b);

const sortByHashes = R.sort(compareHashes);

/**
 * Checks if the hamming distance of the two given hashes is a below a threshold
 * @param {string} hash1
 * @param {string} hash2
 * @returns {boolean}
 */
const hammingDistanceSmallEnough = (hash1, hash2) => {
    const distance = blockHash.hammingDistance(hash1, hash2);
    return distance < 10;
};

/**
 * Takes an array of sorted "tuples" and groups them by similarity
 * @param {function} predicate A function which acts as a predicate whether two hashes can be considered similar enough
 * to be grouped together
 */
const groupBySimilarity = predicate => R.compose(
    R.groupWith(([, a], [, b]) => predicate(a, b)),
    sortByHashes,
    R.unnest
);

const groupByEquality = groupBySimilarity(R.equals);

const groupByHammingDistance = groupBySimilarity(hammingDistanceSmallEnough);

/**
 * Whether the file extension of the given file is jpg or not
 * @param {string} fileName
 * @returns {boolean}
 */
const isJPG = (fileName) => path.extname(fileName) === '.jpg';

/**
 * Splits up the given array into an array which holds n arrays
 * @param {Array.<*>} array
 * @param {number} chunks
 * @returns {Array.<Array.<*>>}
 */
const splitUpIntoChunks = (array, chunks) => {
    const size = Math.ceil(array.length / chunks);
    console.log('Array length:', array.length, 'chunk size:', size, 'chunks:', chunks);
    return R.splitEvery(size, array);
};

/**
 * Calculates the hashes for the given JPGs and spreads the workload to the given thread object
 * @param {Array.<string>} JPGs
 * @param {{thread: Thread, deferred: Array, promises: Array, deferred: Array, handleResolved: function}} hashObj
 */
const calculateHashes = (jpgs, hashObj) => {
    const splitJpgs = splitUpIntoChunks(jpgs, os.cpus().length);
    splitJpgs.forEach((value, index) => {
        var deferred = q.defer();
        hashObj.thread.execute(JSON.stringify({index: index, jpgs: value}));
        hashObj.deferreds.push(deferred);
        hashObj.promises.push(deferred.promise);
    });
    q.all(hashObj.promises).then(hashObj.handleResolved.bind(undefined, hashObj)).done();
};

/**
 * Filters out all "tuples" containing an error message and maps them to error description objects
 * @param {Array.<Array.<string>>} array An array which holds "tuples" of file name/path, hash and error
 * @returns {Array.<{error: string, fileName: string}>}
 */
const getErrors = (array) => {
    return array.filter(tuple =>  tuple[2]).map(tuple => {
        return {error: tuple[2], fileName: path.basename(tuple[0])};
    });
};

/**
 * Filters the given array and returns the file names of groups with more then one entry
 * @param {Function} mapFunc The function which is used to get the file
 * @param {Array.<Array>} groups The grouped entries which are either "tuples" or just file names/paths
 * @returns {Array.<string>}
 */
const getGroupsWithMultipleEntries = (mapFunc, groups) => {
    return groups.filter(group => group.length > 1).map(group => group.map(mapFunc).sort());
};

/**
 * Handles t
 * @param {{thread: Thread, pHash: {}}} md5Obj
 * @param array
 */
const handleMd5PromisesResolved = (md5Obj, array) => {
    md5Obj.thread.close();
    const grouped = groupByEquality(array);
    const groups = grouped.map(group => group.map(tuple => tuple[0]).sort());
    results.duplicates = getGroupsWithMultipleEntries(file => file, groups);
    calculateHashes(groups.map(group => group[0]), md5Obj.pHash);
};

/**
 * Handles the case that all promises are resolved. Sorts the tuple of hashes and file names and groups them by hamming
 * distance
 * @param {{}} pHashObj
 * @param {Array.<Array.<string>>} array
 */
const handlePHashPromisesResolved = (pHashObj, array) => {
    pHashObj.thread.close();
    const grouped = groupByHammingDistance(array);
    results.potentialDuplicates = getGroupsWithMultipleEntries(tuple => tuple[0], grouped);
    console.timeEnd('Hashing');
    const errors = getErrors(R.unnest(array));
    if (errors.length) {
        results.brokenFiles = errors;
    }
    resultDeferred.resolve(results);
};

/**
 * @param {string} error
 * @param {Array.<string>} dirs
 * @param {Array.<string>} files
 */
const handleReadDirectory =  (error, dirs, files) => {
    if (error) {
        console.log(error);
    } else {
        console.time('Hashing');

        const md5 = {
            promises: [], deferreds: [], handleResolved: handleMd5PromisesResolved, pHash: {
                promises: [], deferreds: [], handleResolved: handlePHashPromisesResolved
            }
        };

        md5.thread = new Thread('./md5Worker.js', handleThreadOutput.bind(undefined, md5.deferreds), os.cpus().length);
        md5.pHash.thread = new Thread('./pHashWorker.js', handleThreadOutput.bind(undefined, md5.pHash.deferreds), os.cpus().length);

        calculateHashes(files.filter(isJPG, files), md5);
    }
};

const findDuplicates = (dirName) => {
    const rootDir = path.resolve(dirName);
    recursive.readdirr(rootDir, handleReadDirectory);
    return resultDeferred.promise;
};

module.exports = {
    findDuplicates,
    groupByEquality,
    groupByHammingDistance,
    splitUpIntoChunks
};
