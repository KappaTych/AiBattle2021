function GetDataFromObject(object) {
    return JSON.parse(JSON.stringify(object))
}

function CopyDataToObject(source, dist) {
    for (let attr in source) {
        if (source.hasOwnProperty(attr))
            dist[attr] = source[attr];
    }
}

function CopyAndGetDir(data) {
    const controllerData = data.controller.controllerObj;
    const fullController = eval(data.controller.text);

    CopyDataToObject(controllerData, fullController);

    const result = {
        complete: true,
        controller: { controllerObj: GetDataFromObject(fullController), text: data.controller.text },
        dir: fullController.GetDirection(data.info)
    };

    return result;
}

function CopyAndInit(data) {
    const controllerData = data.controller.controllerObj;
    const fullController = eval(data.controller.text);

    CopyDataToObject(controllerData, fullController);

    fullController.Init(data.mapInfo);

    return {
        complete: true,
        controller: { controllerObj: GetDataFromObject(fullController), text: data.controller.text }
    };
}

function MakeWorkerForInit(controller, mapInfo, timeout, timeOutDelegate) {
    const result = {
        complete: false,
        controller: null
    };

    let timerId = null;
    let startReceived = false;

    const worker = MakeWorker("const { workerData, parentPort } = require('worker_threads')" + '\n' +
        "parentPort.postMessage('start');" + '\n' +
        GetDataFromObject.toString() + '\n' +
        CopyDataToObject.toString() + '\n' +
        CopyAndInit.toString() + '\n' +
        "parentPort.postMessage(CopyAndInit(workerData));",
        function(data) {
            if (data === 'start') {
                if (!startReceived) {
                    startReceived = true;
                    if (timerId !== null)
                        clearTimeout(timerId);
                    timerId = setTimeout(timeOutDelegate, timeout, worker, result);
                }
            } else {
                result.complete = data.complete;
                result.controller = data.controller;
            }
        }, {
            controller: GetDataFromObject(controller),
            mapInfo: GetDataFromObject(mapInfo)
        });

    const timeCorrector = 50;
    if (timeOutDelegate !== null && timeOutDelegate !== undefined) {
        timerId = setTimeout(timeOutDelegate, timeout + timeCorrector, worker, result);
    }

    return worker;
}

function MakeWorkerForGetDirection(controller, dataInfo, timeout, timeOutDelegate) {
    const result = {
        complete: false,
        controller: null,
        dir: -1
    };

    let timerId = null;
    let startReceived = false;

    const worker = MakeWorker("const { workerData, parentPort } = require('worker_threads')" + '\n' +
        "parentPort.postMessage('start');" + '\n' +
        GetDataFromObject.toString() + '\n' +
        CopyDataToObject.toString() + '\n' +
        CopyAndGetDir.toString() + '\n' +
        "parentPort.postMessage(CopyAndGetDir(workerData));",
        function(data) {
            if (data === 'start') {
                if (!startReceived) {
                    startReceived = true;
                    if (timerId !== null)
                        clearTimeout(timerId);
                    timerId = setTimeout(timeOutDelegate, timeout, worker, result);
                }
            } else {
                result.complete = data.complete;
                result.controller = data.controller;
                result.dir = data.dir;
            }
        }, {
            controller: GetDataFromObject(controller),
            info: GetDataFromObject(dataInfo)
        });


    const timeCorrector = 50;
    if (timeOutDelegate !== null && timeOutDelegate !== undefined) {
        timerId = setTimeout(timeOutDelegate, timeout + timeCorrector, worker, result);
    }

    return worker;
}

function MakeWorker(workerCode, onmessageDelegate, workerData) {
    const tmpobj = tmp.fileSync();
    fs.writeFileSync(tmpobj.name, workerCode);

    const worker = new Worker(tmpobj.name, { workerData });
    if (onmessageDelegate !== null && onmessageDelegate !== undefined) {
        worker.on('message', onmessageDelegate);
        worker.on('error',
            function name(params) {
                console.log('Error happened on the worker');
            });
        worker.on('exit',
            function(code) {
                if (code !== 0)
                    console.log('Worker stopped with exit code ' + code);
            })
    }

    return worker;
}