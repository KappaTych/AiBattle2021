function RunEval(input) {
    return eval(input);
}

function ValidateController(controller) {
    return controller.Init != null && controller.Init != undefined && typeof controller.Init === 'function' &&
        controller.GetDirection != null && controller.GetDirection != undefined && typeof controller.GetDirection === 'function';
}

function ValidateControllerText (text)
{
    return ValidateController(RunEval(text));
}

function LoadControllerFromString(input) {
    let controller = RunEval(input);
    if (!ValidateController(controller)) {
        throw "Controller broken";
    }

    return controller;
}