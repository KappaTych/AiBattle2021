class StaticObject extends VisibleGameObject {
    constructor(texture, char) {
        super(texture);
        this.char = char;
    }
}

class Wall extends StaticObject {
    constructor() {
        super(ResourceLoader.LoadPng("resources/textures/wall.png"), "#");
    }
}

class Tree extends StaticObject {
    constructor() {
        super(ResourceLoader.LoadPng("resources/textures/tree.png"), "*");
    }
}

class Field extends StaticObject {
    constructor(currentSnowCount = 0, maxSnowCount = 20) {
        super(ResourceLoader.LoadPng("resources/textures/fields/field0.png"), ".");
        this.currentSnowCount = currentSnowCount;
        this.maxSnowCount = maxSnowCount;
        this.texturesForSnow = []
        for (let i = 0; i <= 4; ++i)
            this.texturesForSnow.push(ResourceLoader.LoadPng("resources/textures/fields/field" + i + ".png"));
    }

    SetSnowCount(count) {
        if (count > this.maxSnowCount)
            throw "You cannot add snow more than the maximum value";
        this.currentSnowCount = count;

        if (this.currentSnowCount === 0) {
            this.texture = this.texturesForSnow[0];
        } else {
            this.texture = this.texturesForSnow[1];
            for (let i = 1; i < 4; ++i) {
                if (this.currentSnowCount > i * this.maxSnowCount / 4)
                    this.texture = this.texturesForSnow[i + 1];
            }
        }
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