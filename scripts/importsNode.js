'use strict';
const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads');

const tmp = require('tmp');
const fs = require('fs');