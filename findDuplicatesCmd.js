'use strict';

const uniqueImages = require('./uniqueImages.js');

const formattedLog = (message, array) => console.log(message, JSON.stringify(array, null, 4));

uniqueImages.findDuplicates(process.argv[2]).then(({duplicates, potentialDuplicates, brokenFiles}) => {
    formattedLog('Duplicates:', duplicates);
    formattedLog('Potential duplicates', potentialDuplicates);
    formattedLog('Files which have caused errors', brokenFiles);
});
