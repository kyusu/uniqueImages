'use strict';

const uniqueImages = require('./uniqueImages.js');
const app = require('./uniqueImagesUi/bin/www.js');
const path = require('path');
const sizeOf = require('image-size');
const readChunk = require('read-chunk');
const imageType = require('image-type');

const getMetaData = (file) => {
    try {
        var metaData;
        const buffer = readChunk.sync(file, 0, 12);
        const type = imageType(buffer);
        if (type && type.mime === 'image/jpeg') {
            const dimensions = sizeOf(file);
            return {
                width: dimensions.width,
                height: dimensions.height
            };
        } else {
            metaData = {};
        }
        return metaData;
    } catch (e) {
        console.log(e);
        return {};
    }
};

const augmentImage = tuple => {
    return tuple.map(file => {
        return {
            file: file,
            metaData: getMetaData(file),
            fileName: path.basename(file)
        };
    });

};

const handleDuplicates = (results) => {
    const augmentedDuplicates = results.duplicates.map(augmentImage);
    const augmentedPotentialDuplicates = results.potentialDuplicates.map(augmentImage);
    const augmentedResults = {
        duplicates: augmentedDuplicates,
        potentialDuplicates: augmentedPotentialDuplicates,
        brokenFiles: results.brokenFiles
    };
    app.startServer(augmentedResults);
};
uniqueImages.findDuplicates(process.argv[2]).then(handleDuplicates);







