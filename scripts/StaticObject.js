class StaticObject extends VisibleGameObject {
    constructor(texture) {
        super(texture);
    }
}

class Wall extends StaticObject {
    constructor() {
        super(ResourceLoader.LoadPng("resources/textures/wall.png"));
    }
}

class Tree extends StaticObject {
    constructor() {
        super(ResourceLoader.LoadPng("resources/textures/tree.png"));
    }
}

class Field extends StaticObject {
    constructor() {
        super(ResourceLoader.LoadPng("resources/textures/field0.png"));
        this.currentSnowCount = 0;
        this.maxSnowCount = 3;
        this.texturesForSnow = []
        for (let i = 0; i <= this.maxSnowCount; ++i)
            this.texturesForSnow.push(ResourceLoader.LoadPng("resources/textures/field" + i + ".png"));
    }

    SetSnowCount(count) {
        if (count > this.maxSnowCount)
            throw "You cannot add snow more than the maximum value";
        this.currentSnowCount = count;
        this.texture = this.texturesForSnow[this.currentSnowCount];
    }

    GetSnowCount() {
        return this.currentSnowCount;
    }

    IncSnow() {
        if (this.currentSnowCount + 1 > this.maxSnowCount)
            return 0;
        this.SetSnowCount(this.GetSnowCount() + 1);
        return -1;
    }

    DecSnow() {
        if (this.currentSnowCount - 1 < 0)
            return 0;
        this.SetSnowCount(this.GetSnowCount() - 1);
        return 1;
    }
}