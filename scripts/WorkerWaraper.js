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

function MakeWorker(workerCode, onmessageDelegate) {
    window.URL = window.URL || window.webkitURL;
    let blob;
    try {
        blob = new Blob([workerCode], {
            type: 'application/javascript'
        });
    } catch (e) {
        // Backwards-compatibility
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(workerCode);
        blob = blob.getBlob();
    }
    const worker = new Worker(URL.createObjectURL(blob));
    if (onmessageDelegate !== null && onmessageDelegate !== undefined)
        worker.onmessage = onmessageDelegate;

    return worker;
}

function MakeWorkerForInit(controller, mapInfo, timeout, timeOutDelegate) {
    const result = {
        complete: false,
        controller: null
    };

    let timerId = null;
    let startReceived = false;

    const worker = MakeWorker(GetDataFromObject.toString() + '\n' +
        "postMessage('start');" + '\n' +
        CopyDataToObject.toString() + '\n' +
        CopyAndInit.toString() + '\n' +
        "self.onmessage=function(e){postMessage(CopyAndInit(e.data));}",
        function(e) {
            if (e.data === 'start') {
                if (!startReceived) {
                    startReceived = true;
                    if (timerId !== null)
                        clearTimeout(timerId);
                    timerId = setTimeout(timeOutDelegate, timeout, worker, result);
                }
            } else {
                result.complete = e.data.complete;
                result.controller = e.data.controller;
            }
        });

    worker.postMessage({
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

    const worker = MakeWorker(GetDataFromObject.toString() + '\n' +
        "postMessage('start');" + '\n' +
        CopyDataToObject.toString() + '\n' +
        CopyAndGetDir.toString() + '\n' +
        "self.onmessage=function(e){postMessage(CopyAndGetDir(e.data));}",
        function(e) {
            if (e.data === 'start') {
                if (!startReceived) {
                    startReceived = true;
                    if (timerId !== null)
                        clearTimeout(timerId);
                    timerId = setTimeout(timeOutDelegate, timeout, worker, result);
                }
            } else {
                result.complete = e.data.complete;
                result.controller = e.data.controller;
                result.dir = e.data.dir;
            }
        });

    worker.postMessage({
        controller: GetDataFromObject(controller),
        info: GetDataFromObject(dataInfo)
    });

    const timeCorrector = 50;
    if (timeOutDelegate !== null && timeOutDelegate !== undefined) {
        timerId = setTimeout(timeOutDelegate, timeout + timeCorrector, worker, result);
    }

    return worker;
}