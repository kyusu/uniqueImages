const test = require('ava');
const R = require('ramda');
const uniqueImages = require('./uniqueImages.js');

test('groupBySimilarity - groups by strict equality', t => {
    const testTuples = [
        [
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001a29'],
            ['John Wyclif', '166d0ba5c83e68a2c58698242a1060bc'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c'],
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001a29'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c'],
        ]
    ];
    const result = uniqueImages.groupByEquality(testTuples);
    const expected = [
        [
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001a29'],
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001a29']
        ],
        [
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c']
        ],
        [
            ['John Wyclif', '166d0ba5c83e68a2c58698242a1060bc']
        ]
    ];
    t.deepEqual(result, expected, 'equals')
});

test('groupBySimilarity - groups by hamming distance', t => {
    const testTuples = [
        [
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001b39'],
            ['John Wyclif', '166d0ba5c83e68a2c58698242a1060bc'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b4e'],
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001c49'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b3d'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c'],
        ]
    ];
    const result = uniqueImages.groupByHammingDistance(testTuples);
    const expected = [
        [
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001c49'],
            ['Jan Hus', 'cae905beeea21b00ad2c713c1a001b39']
        ],
        [
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b4e'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b3d'],
            ['Jan Žižka', '3447458c16ed6bc337d33bddcdd87b2c']
        ],
        [
            ['John Wyclif', '166d0ba5c83e68a2c58698242a1060bc']
        ]
    ];
    t.deepEqual(result, expected, 'hamming distance is small enough');
});

test('splitIntoChunks', t => {
    const result = uniqueImages.splitUpIntoChunks(R.range(0, 88), 8);
    const expected = [
        [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10
        ],
        [
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21
        ],
        [
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32
        ],
        [
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43
        ],
        [
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            52,
            53,
            54
        ],
        [
            55,
            56,
            57,
            58,
            59,
            60,
            61,
            62,
            63,
            64,
            65
        ],
        [
            66,
            67,
            68,
            69,
            70,
            71,
            72,
            73,
            74,
            75,
            76
        ],
        [
            77,
            78,
            79,
            80,
            81,
            82,
            83,
            84,
            85,
            86,
            87
        ]
    ];
    t.deepEqual(result, expected, 'Resulting is split into 8 chunks');
});
