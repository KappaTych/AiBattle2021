class SceneInfoForController {
    constructor(playerPos, enemies, snowballs) {
        this.playerPos = playerPos;
        this.enemies = enemies;
        this.snowball = snowballs;
    }
}

class PlayerBase extends GameObject {
    constructor(topLeft, bottomRight) {
        super();
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }
}

function ValidatePositiveNumber(number, nameForError) {
    if (typeof number !== "number") {
        alert(nameForError + " not number");
        return false;
    }

    if (number <= 0) {
        alert(nameForError + " <= 0");
        return false;
    }

    return true;
}

class MapInfo {
    constructor(width, height, map, spawns, bases, turns, snowIncreasePeriod = 0, lastSnowIncreaseStep = 0, snowIncreaseValue = null, startSnowMap = null) {
        this.width = width;
        this.height = height;
        this.map = map;
        this.spawns = spawns;
        this.bases = bases;
        this.turns = turns;
        this.snowIncreasePeriod = snowIncreasePeriod;
        this.lastSnowIncreaseStep = lastSnowIncreaseStep;
        this.snowIncreaseValue = snowIncreaseValue;
        this.startSnowMap = startSnowMap;
    }

    GetSafeMapInfo() {
        let map = []
        for (let h = 0; h < this.height; ++h) {
            map[h] = [];
            for (let w = 0; w < this.width; ++w) {
                map[h][w] = Clone(this.map[h][w]);
            }
        }

        let spawns = []

        for (let i = 0; i < this.spawns.length; ++i)
            spawns.push(Clone(this.spawns[i]));

        let bases = []

        for (let i = 0; i < this.bases.length; ++i) {
            let topLeft = this.bases[i].topLeft;
            let bottomRight = this.bases[i].bottomRight;
            bases.push(new PlayerBase({ x: topLeft.x, y: topLeft.y }, { x: bottomRight.x, y: bottomRight.y }));
        }

        return new MapInfo(this.width, this.height, map, spawns, bases, this.turns, this.snowIncreasePeriod, this.lastSnowIncreaseStep, Clone(this.snowIncreaseValue), Clone(this.startSnowMap));
    }

    static MapCharToGameObject(char) {
        switch (char) {
            case '#':
                return new Wall();
            case '*':
                return new Tree();
            case '.':
                return new Field();
        }
    }

    static ValidateSize(obj) {
        return ValidatePositiveNumber(obj.width, "width") && ValidatePositiveNumber(obj.height, "height");
    }

    static ValidateMap(obj) {
        let width = obj.width * 1;
        let height = obj.height * 1;

        if (obj.map.length !== height) {
            alert("Real map height !== height")
            return false;
        }

        for (let h = 0; h < height; ++h) {
            if (obj.map[h].length < width) {
                alert("there are not enough characters in the line describing the map line: " + h);
                return false;
            }

            if (obj.map[h].length > width) {
                alert("there are too many characters in the line describing the map line: " + h);
                return false;
            }

            for (let w = 0; w < width; ++w) {
                if (!(obj.map[h][w] === "*" || obj.map[h][w] === "#" || obj.map[h][w] === ".")) {
                    alert("Strange char at w: " + w + " h: " + h);
                    return false;
                }
            }
        }

        return true;
    }

    static ValidateTurns(obj) {
        return ValidatePositiveNumber(obj.turns, "turns");
    }

    static ValidateSpawns(obj) {
        if (obj.spawns.length < 0) {
            alert("spawns.length < 0")
            return false;
        }

        if (obj.spawns.length !== obj.bases.length) {
            alert("spawns.length != bases.length")
            return false;
        }

        for (let i = 0; i < obj.spawns.length; ++i) {
            if (typeof obj.spawns[i].x !== "number" || typeof obj.spawns[i].y !== "number") {
                alert("wrong spawn #" + i + " format");
                return false;
            }
        }

        return true;
    }

    static ValidateBases(obj) {
        for (let i = 0; i < obj.bases.length; ++i) {
            let topLeft = obj.bases[i].topLeft;
            if (typeof topLeft.x !== "number" || typeof topLeft.y !== "number") {
                alert("wrong topLeft base #" + i + " format");
                return false;
            }
            let bottomRight = obj.bases[i].bottomRight;
            if (typeof bottomRight.x !== "number" || typeof bottomRight.y !== "number") {
                alert("wrong bottomRight base #" + i + " format");
                return false;
            }

            if (topLeft.x > bottomRight.x) {
                alert("base #" + i + "topLeft.x>bottomRight.x");
                return false;
            }
            if (topLeft.y > bottomRight.y) {
                alert("base #" + i + "topLeft.y>bottomRight.y");
                return false;
            }
        }

        return true;
    }

    static ValidateStartSnowMap(obj) {
        if (typeof obj.startSnowMap === "number") {
            if (obj.startSnowMap <= 0) {
                alert("startSnowMap <= 0");
                return false;
            }
            return true;
        }

        if (typeof obj.startSnowMap === "object") {

            let width = obj.width * 1;
            let height = obj.height * 1;

            if (obj.startSnowMap.length !== height) {
                alert("Real map height !== startSnowMap height")
                return false;
            }

            for (let h = 0; h < height; ++h) {
                if (obj.startSnowMap[h].length < width) {
                    alert("there are not enough characters in the line describing the startSnowMap: " + h);
                    return false;
                }

                if (obj.startSnowMap[h].length > width) {
                    alert("there are too many characters in the line describing the startSnowMap line: " + h);
                    return false;
                }

                for (let w = 0; w < width; ++w) {
                    if (!ValidatePositiveNumber(obj.startSnowMap[h][w], "startSnowMap " + w + " " + h)) {
                        return false;
                    }
                }
            }

            return true;
        }

        alert("startSnowMap not number or array");
        return false;
    }

    static ValidateSnowIncreasePeriod(obj) {
        return ValidatePositiveNumber(obj.snowIncreasePeriod, "snowIncreasePeriod");
    }

    static ValidateLastSnowIncreaseStep(obj) {
        return ValidatePositiveNumber(obj.lastSnowIncreaseStep, "lastSnowIncreaseStep");
    }

    static ValidateSnowIncreaseValue(obj) {
        if (typeof obj.snowIncreaseValue === "number") {
            if (obj.snowIncreaseValue <= 0) {
                alert("snowIncreaseValue <= 0");
                return false;
            }
            return true;
        }

        if (typeof obj.snowIncreaseValue === "object") {
            let width = obj.width * 1;
            let height = obj.height * 1;

            if (obj.snowIncreaseValue.length !== height) {
                alert("Real map height !== snowIncreaseValue height")
                return false;
            }

            for (let h = 0; h < height; ++h) {
                if (obj.snowIncreaseValue[h].length < width) {
                    alert("there are not enough characters in the line describing the snowIncreaseValue line: " + h);
                    return false;
                }

                if (obj.snowIncreaseValue[h].length > width) {
                    alert("there are too many characters in the line describing the snowIncreaseValue line: " + h);
                    return false;
                }

                for (let w = 0; w < width; ++w) {
                    if (!ValidatePositiveNumber(obj.startSnowMap[h][w], "snowIncreaseValue " + w + " " + h)) {
                        return false;
                    }
                }
            }

            return true;
        }

        alert("snowIncreaseValue not number or array");
        return false;
    }

    static IsJsonValid(json) {
        let obj = JSON.parse(json);
        return this.ValidateSize(obj) &&
            this.ValidateMap(obj) &&
            this.ValidateTurns(obj) &&
            this.ValidateSpawns(obj) &&
            this.ValidateBases(obj) &&
            this.ValidateStartSnowMap(obj) &&
            this.ValidateSnowIncreasePeriod(obj) &&
            this.ValidateLastSnowIncreaseStep(obj) &&
            this.ValidateSnowIncreaseValue(obj);
    }

    static LoadMapFromJson(json) {
        let obj = JSON.parse(json);

        if (!MapInfo.IsJsonValid(json)) {
            alert("Json is invalide")
            return;
        }

        let width = obj.width * 1;
        let height = obj.height * 1;

        let map = [];
        for (let h = 0; h < height; ++h) {
            map[h] = []
            for (let w = 0; w < width; ++w) {
                map[h][w] = this.MapCharToGameObject(obj.map[h][w]);
                if (map[h][w].constructor.name === "Field") {
                    map[h][w].SetSnowCount(typeof obj.startSnowMap === "number" ? obj.startSnowMap : obj.startSnowMap[h][w])
                }
            }
        }

        let spawns = [];
        for (let i = 0; i < obj.spawns.length; ++i) {
            spawns.push({ x: obj.spawns[i].x, y: obj.spawns[i].y });
        }

        let bases = []
        for (let i = 0; i < obj.bases.length; ++i) {
            let topLeft = obj.bases[i].topLeft;
            let bottomRight = obj.bases[i].bottomRight;
            bases.push(new PlayerBase({ x: topLeft.x, y: topLeft.y }, { x: bottomRight.x, y: bottomRight.y }))
        }

        let turns = obj.turns * 1;

        return new MapInfo(width, height, map, spawns, bases, turns, obj.snowIncreasePeriod, obj.lastSnowIncreaseStep, obj.snowIncreaseValue, obj.startSnowMap);
    }
}

class Scene {

    static moves = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
    static baseDefaultColors = [
        "white",
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "indigo",
        "violet"
    ];

    constructor(mapInfo, bots, isRandomSpawn = false, isAsyncBotsInit = false, timeout = 10, onComplete = null) {
        this.mapInfo = mapInfo;
        this.bots = bots;
        this.snowballs = [];
        this.startTurnsCount = this.mapInfo.turns;

        if (this.bots.length > mapInfo.spawns.length) {
            throw "Spawns not enough";
        }

        let spawns = mapInfo.spawns.slice();
        this.dynamicLayer = [];
        let map = this.mapInfo.map;
        for (let h = 0; h < map.length; ++h) {
            this.dynamicLayer[h] = []
            for (let w = 0; w < map[h].length; ++w) {
                this.dynamicLayer[h][w] = null;
            }
        }

        if (isRandomSpawn)
            spawns.sort(() => Math.random() - 0.5);

        for (let i = 0; i < this.bots.length; ++i) {
            this.bots[i].x = spawns[i].x * 1;
            this.bots[i].y = spawns[i].y * 1;
            this.dynamicLayer[this.bots[i].y][this.bots[i].x] = this.bots[i];
        }

        if (isAsyncBotsInit) {
            this.AsyncBotsInit(timeout, onComplete);
        } else {
            this.InitBots();
        }
    }

    RenameBot(oldName, newName) {
        for (let i = 0; i < this.bots.length; ++i) {
            let bot = this.bots[i];
            if (bot.name === oldName) {
                bot.name = newName;
            }
        }
    }

    InitBots() {
        for (let i = 0; i < this.bots.length; ++i) {
            bots[i].controller.Init({ mapInfo: this.mapInfo.GetSafeMapInfo(), index: i });
        }
    }

    AsyncBotsInit(timeout, onComplete) {
        this.IterateAsyncInit(timeout, 0, onComplete);
    }

    IterateAsyncInit(timeout = 10, botIndex = 0, onComplete = null) {
        let scene = this;

        if (scene.bots.length === 0) {
            if (onComplete !== null && onComplete !== undefined)
                onComplete();
            return;
        }

        this.currentWorker = MakeWorkerForInit(
            scene.bots[botIndex].controller, { mapInfo: scene.mapInfo.GetSafeMapInfo(), index: botIndex },
            timeout,
            function next(worker, result) {
                worker.terminate();
                if (result.complete) {
                    CopyDataToObject(result.controller, scene.bots[botIndex].controller);
                } else {
                    console.log("bot #" + botIndex + " init unsuccessful");
                }

                if (botIndex + 1 === scene.bots.length) {
                    if (onComplete !== null && onComplete !== undefined)
                        onComplete();
                } else {
                    scene.IterateAsyncInit(timeout, botIndex + 1, onComplete)
                }
            }
        );
    }

    MoveDynamicObject(dynObj, x, y) {
        this.dynamicLayer[dynObj.y][dynObj.x] = null;
        dynObj.x = x;
        dynObj.y = y;
        this.dynamicLayer[dynObj.y][dynObj.x] = dynObj;
    }

    PrepareDataForController(botIndex) {
        let enemies = [];
        for (let i = 0; i < this.bots.length; ++i) {
            if (i != botIndex) {
                enemies.push({
                    x: this.bots[i].x,
                    y: this.bots[i].y,
                    name: this.bots[i].name,
                })
            }
        }

        let snowballs = []
        for (let i = 0; i < this.snowballs.length; ++i) {
            snowballs.push({
                x: this.snowballs[i].x,
                y: this.snowballs[i].y,
                name: this.snowballs[i].currentSnowCount,
            })
        }

        return new SceneInfoForController({ x: this.bots[botIndex].x, y: this.bots[botIndex].y }, enemies, snowballs);
    }

    UpdateDynamicLayerAfterBotChooseDirection(botIndex, dir) {
        this.bots[botIndex].SetDir(dir);

        let newY = this.bots[botIndex].y + Scene.moves[dir].y;
        let newX = this.bots[botIndex].x + Scene.moves[dir].x;

        if (newX < 0 || newX >= this.mapInfo.width || newY < 0 || newY >= this.mapInfo.height) {
            console.log("bot index:" + botIndex + "tried get out of bounds");
            return;
        }

        let afterY = newY + Scene.moves[dir].y;
        let afterX = newX + Scene.moves[dir].x;

        let map = this.mapInfo.map;
        if (map[newY][newX].constructor.name === "Field") {
            if (this.dynamicLayer[newY][newX] == null) {
                if ((afterX > 0 && afterX < this.mapInfo.width && afterY > 0 && afterY < this.mapInfo.height) &&
                    (map[afterY][afterX].constructor.name === "Field" && this.dynamicLayer[afterY][afterX] == null)) {
                    if (map[newY][newX].GetSnowCount() + map[newY][newX].GetSnowCount() > 0) {
                        let snowball = new Snowball(afterX, afterY, dir);
                        map[newY][newX].SetSnowCount(snowball.AddSnow(map[newY][newX].GetSnowCount()));
                        map[afterY][afterX].SetSnowCount(snowball.AddSnow(map[afterY][afterX].GetSnowCount()));
                        this.snowballs.push(snowball);
                        this.dynamicLayer[afterY][afterX] = snowball;
                    }
                }
                this.MoveDynamicObject(this.bots[botIndex], newX, newY);
            } else {
                if (this.dynamicLayer[newY][newX].constructor.name === "Snowball") {
                    if ((afterX > 0 && afterX < this.mapInfo.width && afterY > 0 && afterY < this.mapInfo.height) &&
                        (map[afterY][afterX].constructor.name === "Field" && this.dynamicLayer[afterY][afterX] == null)) {
                        let snowball = this.dynamicLayer[newY][newX];
                        map[newY][newX].SetSnowCount(snowball.AddSnow(map[newY][newX].GetSnowCount()));
                        map[afterY][afterX].SetSnowCount(snowball.AddSnow(map[afterY][afterX].GetSnowCount()));
                        this.MoveDynamicObject(this.dynamicLayer[newY][newX], afterX, afterY);
                        this.MoveDynamicObject(this.bots[botIndex], newX, newY);
                    }
                }
            }
        }
    }

    UpdateSnowOnFileds() {
        let map = this.mapInfo.map;
        if (this.startTurnsCount - this.mapInfo.turns < this.mapInfo.lastSnowIncreaseStep &&
            (this.startTurnsCount - this.mapInfo.turns) % this.mapInfo.snowIncreasePeriod === 0) {
            for (let h = 0; h < map.length; ++h) {
                for (let w = 0; w < map[h].length; ++w) {
                    if (map[h][w].constructor.name === "Field") {
                        if (typeof this.mapInfo.snowIncreaseValue === 'number')
                            map[h][w].AddSnow(this.mapInfo.snowIncreaseValue)
                        else
                            map[h][w].AddSnow(this.mapInfo.snowIncreaseValue[h][w]);
                    }
                }
            }
        }
    }

    CalcScores() {
        let scores = [];
        for (let i = 0; i < this.bots.length; ++i) {
            scores[i] = { value: 0, botName: this.bots[i].name };
            for (let h = this.mapInfo.bases[i].topLeft.y; h <= this.mapInfo.bases[i].bottomRight.y; ++h) {
                for (let w = this.mapInfo.bases[i].topLeft.x; w <= this.mapInfo.bases[i].bottomRight.x; ++w) {
                    if (this.dynamicLayer[h][w] !== null &&
                        this.dynamicLayer[h][w] !== undefined &&
                        this.dynamicLayer[h][w].constructor.name === "Snowball") {
                        scores[i].value += this.dynamicLayer[h][w].GetSnowCount();
                    }
                }
            }
        }

        return scores;
    }

    Render(canvas, tileSize = 20) {
        let map = this.mapInfo.map;
        canvas.width = map[0].length * tileSize;
        canvas.height = map.length * tileSize;
        let context = canvas.getContext('2d');
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                context.drawImage(map[h][w].texture, w * tileSize, h * tileSize, tileSize, tileSize);
            }
        }

        if (this.bots.length > 0) {
            for (let i = 0; i < this.bots.length; ++i) {
                let topLeft = this.mapInfo.bases[i].topLeft;
                let bottomRight = this.mapInfo.bases[i].bottomRight;
                context.beginPath();
                context.rect(topLeft.x * tileSize, topLeft.y * tileSize, (bottomRight.x - topLeft.x + 1) * tileSize, (bottomRight.y - topLeft.y + 1) * tileSize);
                context.fillStyle = this.bots[i].color;
                context.fillStyle = HexToRgbA(context.fillStyle, 0.3);
                context.fill();
            }
        } else {
            for (let i = 0; i < this.mapInfo.bases.length; ++i) {
                let topLeft = this.mapInfo.bases[i].topLeft;
                let bottomRight = this.mapInfo.bases[i].bottomRight;
                context.beginPath();
                context.rect(topLeft.x * tileSize, topLeft.y * tileSize, (bottomRight.x - topLeft.x + 1) * tileSize, (bottomRight.y - topLeft.y + 1) * tileSize);
                context.fillStyle = Scene.baseDefaultColors[i];
                context.fill();
            }
        }

        for (let i = 0; i < this.bots.length; ++i) {
            let bot = this.bots[i];
            context.beginPath();
            context.drawImage(bot.texture, bot.x * tileSize, bot.y * tileSize, tileSize, tileSize);
            this.DrawText(context, bot.name, bot.x, bot.y, tileSize)
        }

        for (let i = 0; i < this.snowballs.length; ++i) {
            let snowball = this.snowballs[i];
            context.drawImage(snowball.texture, snowball.x * tileSize, snowball.y * tileSize, tileSize, tileSize);
        }

        if (this.bots.length === 0) {
            this.DrawSpawns(context, tileSize);
        }
    }

    DrawSpawns(context, tileSize) {
        for (let i = 0; i < this.mapInfo.spawns.length; ++i) {
            let spawn = this.mapInfo.spawns[i];
            this.DrawText(context, "sp " + i, spawn.x, spawn.y, tileSize, tileSize / 2);
            context.beginPath();
            context.rect(spawn.x * tileSize, spawn.y * tileSize, tileSize, tileSize);
            context.strokeStyle = "black";
            context.lineWidth = 2;
            context.stroke();
        }
    }

    DrawText(context, text, x, y, tileSize, verticalOffset = null) {
        let maxTextHeigth = tileSize / 3;

        context.beginPath();
        let height = tileSize / 10;
        context.font = "normal " + height + "px Verdana";
        let width = context.measureText(text).width;

        height *= tileSize / width;
        height = Math.min(height, maxTextHeigth);
        width = tileSize;

        context.font = "normal " + height + "px Verdana";
        context.fillStyle = "#000000";

        if (verticalOffset === null)
            verticalOffset = height / 2;

        let realWidth = context.measureText(text).width;
        context.fillText(text, x * tileSize + (tileSize - realWidth) / 2, y * tileSize + verticalOffset, width);
    }

    DecTurns() {
        if (this.mapInfo.turns === 0) {
            alert("Run out of turns");
            return false;
        }
        --this.mapInfo.turns;
        return true;
    }

    NextStep() {
        if (!this.DecTurns())
            return this.CalcScores();

        for (let i = 0; i < this.bots.length; ++i) {
            let dir = this.bots[i].controller.GetDirection(this.PrepareDataForController(i));
            if (!(dir === 0 || dir === 1 || dir === 2 || dir === 3)) {
                alert("bad direction format " + this.bots[i].name);
                continue;
            }
            this.UpdateDynamicLayerAfterBotChooseDirection(i, dir);
        }

        this.UpdateSnowOnFileds();
        return this.CalcScores();
    }

    NextStepWithTimer(timeout, onComplete) {
        if (this.DecTurns())
            this.IterateAsyncStep(timeout, 0, onComplete);
    }

    IterateAsyncStep(timeout, botIndex = 0, onComplete = null) {
        let scene = this;
        if (scene.bots.length === 0) {
            scene.UpdateSnowOnFileds();
            if (onComplete !== null && onComplete !== undefined)
                onComplete(scene.CalcScores());
            return;
        }
        this.currentWorker = MakeWorkerForGetDirection(
            scene.bots[botIndex].controller,
            scene.PrepareDataForController(botIndex),
            timeout,
            function next(worker, result) {
                worker.terminate();
                if ((result.dir === 0 || result.dir === 1 || result.dir === 2 || result.dir === 3)) {
                    CopyDataToObject(result.controller, scene.bots[botIndex].controller);
                    scene.UpdateDynamicLayerAfterBotChooseDirection(botIndex, result.dir);
                } else {
                    console.log("bot #" + botIndex + "wrong dir format");
                }

                if (botIndex + 1 === scene.bots.length) {
                    scene.UpdateSnowOnFileds();
                    if (onComplete !== null && onComplete !== undefined)
                        onComplete(scene.CalcScores());
                } else {
                    scene.IterateAsyncStep(timeout, botIndex + 1, onComplete)
                }
            }
        );
    }
}