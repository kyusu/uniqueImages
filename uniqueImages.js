'use strict';

var blockhash = require('blockhash');
var fs = require('fs');
var jpeg = require('jpeg-js');
var recursive = require('recursive-fs');
var path = require('path');

var fst = function (array) {
   return array[0];
};

var snd = function (array) {
    return array[1];
};

var compareHashes = function (currentValue, index, array) {
    array.forEach(function (innerCurrentValue, innerIndex) {
        if (index !== innerIndex) {
            var hammingDistance = blockhash.hammingDistance(snd(currentValue), snd(innerCurrentValue));
            console.log (path.basename(fst(currentValue)), path.basename(fst(innerCurrentValue)), hammingDistance);
        }
    });
};

var getPHash = function (fileName) {
    var data = fs.readFileSync(fileName);
    var hash = blockhash.blockhashData(jpeg.decode(data), 16, 2);
    return [fileName, hash];
};

var root = path.resolve(process.argv[2]);

recursive.readdirr(root, function (err, dirs, files) {
    if (err) {
        console.log(err);
    } else {
        var hashes = files.map(getPHash);
        hashes.forEach(compareHashes);
    }
});
