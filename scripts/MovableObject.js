class MovableObject extends VisibleGameObject {
    constructor(x, y, dir, texture) {
        super(texture);
        this.dir = dir;
        this.x = x;
        this.y = y;
    }
}

class ControlledObject extends MovableObject {
    constructor(x, y, dir, texture, controller, name) {
        super(x, y, dir, texture)
        this.controller = controller;
        this.name = name;
    }

    GetDirection(mapInfo) {
        return controller.GetDirection(mapInf);
    }
}

class Bot extends ControlledObject {
    constructor(x, y, dir, controller, name) {
        super(x, y, dir, ResourceLoader.LoadPng("resources/textures/bot0.png"), controller, name);
        this.texturesForDir = [];
        for (let i = 0; i < 4; ++i)
            this.texturesForDir.push(ResourceLoader.LoadPng("resources/textures/bot" + i + ".png"));
    }

    SetDir(dir) {
        this.dir = dir;
        this.texture = this.texturesForDir[this.dir];
    }

    GetDir() {
        return this.dir;
    }
}

class SimpleController {
    constructor() {}
    Init(mapInfo) {
        this.mapInfo = mapInfo;
    }
    GetDirection(sceneInfo) {
        this.sceneInfo = sceneInfo;
    }
}

class Snowball extends MovableObject {
    constructor(x, y, dir, currentSnowCount = 0) {
        super(x, y, dir, ResourceLoader.LoadPng("resources/textures/snowball0.png"));

        this.currentSnowCount = currentSnowCount;
        this.maxSnowCount = 3;
        this.texturesForSnowBall = []
        for (let i = 0; i <= this.maxSnowCount; ++i)
            this.texturesForSnowBall.push(ResourceLoader.LoadPng("resources/textures/snowball" + i + ".png"));
    }

    SetSnowCount(count) {
        if (count > this.maxSnowCount)
            throw "You cannot add snow more than the maximum value";
        this.currentSnowCount = count;
        this.texture = this.texturesForSnowBall[this.currentSnowCount];
    }

    GetSnowCount() {
        return this.currentSnowCount;
    }

    IncSnow() {
        if (this.currentSnowCount + 1 > this.maxSnowCount)
            return 0;
        this.SetSnowCount(this.GetSnowCount() + 1);
        return 1;
    }

    DecSnow() {
        if (this.currentSnowCount - 1 < 0)
            return 0;
        this.SetSnowCount(this.GetSnowCount() - 1);
        return -1;
    }
}