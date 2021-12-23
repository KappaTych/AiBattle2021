class MovableObject extends VisibleGameObject {
    constructor(x, y, dir, texture, anim) {
        super(texture);
        this.dir = dir;
        this.anim = anim;
        this.x = x;
        this.y = y;
    }

    SetDirAndAnim(dir, anim = 0) {
        this.dir = dir;
        this.anim = anim;
    }

    GetDir() {
        return this.dir;
    }

    GetAnim() {
        return this.anim;
    }
}

class ControlledObject extends MovableObject {
    constructor(x, y, dir, texture, controller, name) {
        super(x, y, dir, texture)
        this.controller = controller;
        this.name = name;
    }
}

class Bot extends ControlledObject {
    constructor(x, y, dir, controller, name, color) {
        super(x, y, dir, ResourceLoader.LoadPng("resources/textures/bots/" + color + "Bot/" + "bot_" + 2 + "_" + 0 + ".png "), controller, name);
        this.lastDir = 2;
        this.texturesForDirAnim = [];
        this.color = color;
        for (let i = 0; i < 4; ++i) {
            this.texturesForDirAnim[i] = [];
            for (let j = 0; j < 3; ++j) {
                this.texturesForDirAnim[i].push(ResourceLoader.LoadPng("resources/textures/bots/" + color + "Bot/" + "bot_" + i + "_" + j + ".png "));
            }
        }
    }

    SetDirAndAnim(dir, anim = 0) {
        if (dir !== 4) {
            super.SetDirAndAnim(dir, anim);
            this.texture = this.texturesForDirAnim[this.dir][this.anim];
            this.lastDir = this.GetDir();
        } else {
            anim = 0;
            this.texture = this.texturesForDirAnim[this.lastDir][anim];
            super.SetDirAndAnim(dir, anim);
        }
    }
}

class Snowball extends MovableObject {
    constructor(x, y, dir, currentSnowCount = 1, maxSnowCount = 100) {
        super(x, y, dir, ResourceLoader.LoadPng("resources/textures/snowballs/snowball0.png"));

        this.currentSnowCount = currentSnowCount;
        this.maxSnowCount = maxSnowCount;
        this.texturesForSnowBall = []
        for (let i = 0; i <= 3; ++i)
            this.texturesForSnowBall.push(ResourceLoader.LoadPng("resources/textures/snowballs/snowball" + i + ".png"));
        this.SetSnowCount(this.currentSnowCount);
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
        const ost = this.maxSnowCount - this.GetSnowCount() - value;
        if (ost >= 0) {
            this.SetSnowCount(this.GetSnowCount() + value);
            return 0;
        } else {
            this.SetSnowCount(this.maxSnowCount);
            return -ost;
        }
    }
}