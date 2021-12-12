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
        return controller.controllerObj.GetDirection(mapInf);
    }
}

class Bot extends ControlledObject {
    constructor(x, y, dir, controller, name, color = "white") {
        super(x, y, dir, ResourceLoader.LoadPng("resources/textures/" + color + "Bot/" + "bot0.png "), controller, name);
        this.texturesForDir = [];
        this.color = color;
        for (let i = 0; i < 4; ++i)
            this.texturesForDir.push(ResourceLoader.LoadPng("resources/textures/" + color + "Bot/" + "bot" + i + ".png "));
    }

    SetDir(dir) {
        this.dir = dir;
        this.texture = this.texturesForDir[this.dir];
    }

    GetDir() {
        return this.dir;
    }
}

class Snowball extends MovableObject {
    constructor(x, y, dir, currentSnowCount = 1, maxSnowCount = 100) {
        super(x, y, dir, ResourceLoader.LoadPng("resources/textures/snowball0.png"));

        this.currentSnowCount = currentSnowCount;
        this.maxSnowCount = maxSnowCount;
        this.texturesForSnowBall = []
        for (let i = 0; i <= 3; ++i)
            this.texturesForSnowBall.push(ResourceLoader.LoadPng("resources/textures/snowball" + i + ".png"));
    }

    SetSnowCount(count) {
        if (count > this.maxSnowCount)
            throw "You cannot add snow more than the maximum value";
        this.currentSnowCount = count;

        this.texture = this.texturesForSnowBall[0];
        for (let i = 1; i < 4; ++i) {
            if (this.currentSnowCount > i * this.maxSnowCount / 4)
                this.texture = this.texturesForSnowBall[i];
        }
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
        if (this.currentSnowCount - 1 < 1)
            return 0;
        this.SetSnowCount(this.GetSnowCount() - 1);
        return -1;
    }

    AddSnow(value) {
        let ost = this.maxSnowCount - this.GetSnowCount() - value;
        if (ost >= 0) {
            this.SetSnowCount(this.GetSnowCount() + value);
            return 0;
        } else {
            this.SetSnowCount(this.maxSnowCount);
            return -ost;
        }
    }
}