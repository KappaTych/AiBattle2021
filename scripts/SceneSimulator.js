function InitBotClone(scene, botIndex) {
    let controller = Clone(scene.bots[botIndex].controller);
    controller.controllerObj.Init({ mapInfo: scene.mapInfo.GetSafeMapInfo(), index: botIndex });
    return controller;
}

function GetDirBotClone(scene, botIndex) {
    let controller = Clone(scene.bots[botIndex].controller);
    let dir = controller.controllerObj.GetDirection(scene.PrepareDataForController(botIndex));
    return { controller: controller, dir: dir };
}

function SetBotController(scene, botIndex, controller) {
    scene.bots[botIndex].controller = controller;
    return true;
}

function SetBotState(scene, botIndex, state) {
    scene.bots[botIndex].SetState(state);
}

function InitScene() {
    let mapInfo = MapInfo.LoadMapFromJson($mapInfo);

    let controllerTexts = [$controllerTexts];
    let controllers = [];
    for (let i = 0; i < controllerTexts.length; ++i) {
        let controller = null;
        try {
            controller = LoadControllerFromString(controllerTexts[i]);
        } catch (er) {
            controller = { Init: function () { }, GetRandomInt: function () { } };
        }
        controllers.push(controller);
    }

    let botNames = [$botNames];
    let botColors = [$botColors];

    let bots = [];
    for (let i = 0; i < controllers.length; ++i) {
        bots.push(new Bot(0, 0, 0, controllers[i], botNames[i], botColors[i]));
    }

    let timeout = $timeout;
    let onComplete = $onComplete;
    let isShortReplay = $isShortReplay;

    return new Scene(mapInfo, bots, false, timeout, onComplete, false, isShortReplay);
}

let scene = InitScene();