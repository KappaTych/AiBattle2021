class SceneInfoForController {
    constructor(playerPos, enemies, snowballs, snowLevelMap) {
        this.playerPos = playerPos;
        this.enemies = enemies;
        this.snowball = snowballs;
        this.snowLevelMap = snowLevelMap;
    }
}

class PlayerBase extends GameObject {
    constructor(topLeft, bottomRight) {
        super();
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }
}

function ValidateNotNegativeNumber(number, nameForError) {
    if (typeof number !== "number") {
        alert(nameForError + " not number");
        return false;
    }

    if (number < 0) {
        alert(nameForError + " < 0");
        return false;
    }

    return true;
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

class SafeMapInfo {
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

    static ToMapInfo(safeMapInfo) {
        const map = []
        for (let h = 0; h < safeMapInfo.height; ++h) {
            map[h] = [];
            for (let w = 0; w < safeMapInfo.width; ++w) {
                map[h][w] = MapInfo.MapCharToGameObject(safeMapInfo.map[h][w]);
                if (map[h][w].constructor.name === "Field") {
                    map[h][w].SetSnowCount(typeof safeMapInfo.startSnowMap === "number" ? safeMapInfo.startSnowMap : safeMapInfo.startSnowMap[h][w])
                }
            }
        }



        return new MapInfo(safeMapInfo.width,
            safeMapInfo.height,
            map,
            safeMapInfo.spawns,
            safeMapInfo.bases,
            safeMapInfo.turns,
            safeMapInfo.snowIncreasePeriod,
            safeMapInfo.lastSnowIncreaseStep,
            safeMapInfo.snowIncreaseValue,
            safeMapInfo.startSnowMap);
    }
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
        const map = []
        for (let h = 0; h < this.height; ++h) {
            map[h] = [];
            for (let w = 0; w < this.width; ++w) {
                map[h][w] = Clone(this.map[h][w].char);
            }
        }

        const spawns = []

        for (let i = 0; i < this.spawns.length; ++i)
            spawns.push(Clone(this.spawns[i]));

        const bases = []

        for (let i = 0; i < this.bases.length; ++i) {
            let topLeft = this.bases[i].topLeft;
            let bottomRight = this.bases[i].bottomRight;
            bases.push(new PlayerBase({ x: topLeft.x, y: topLeft.y }, { x: bottomRight.x, y: bottomRight.y }));
        }

        return new SafeMapInfo(this.width, this.height, map, spawns, bases, this.turns, this.snowIncreasePeriod, this.lastSnowIncreaseStep, Clone(this.snowIncreaseValue), Clone(this.startSnowMap));
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
        const width = obj.width * 1;
        const height = obj.height * 1;

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
        if (!ValidateNotNegativeNumber(obj.spawns.length, "spawns.length")) {
            return false;
        }

        if (obj.spawns.length !== obj.bases.length) {
            alert("spawns.length != bases.length")
            return false;
        }

        for (let i = 0; i < obj.spawns.length; ++i) {
            if (!(ValidateNotNegativeNumber(obj.spawns[i].x, "spawn.x") &&
                    ValidateNotNegativeNumber(obj.spawns[i].y, "spawn.y"))) {
                return false;
            }

            if (obj.map[obj.spawns[i].y][obj.spawns[i].x] !== ".") {
                alert("spawn #" + i + " does not locate on the field");
                return false;
            }
        }

        return true;
    }

    static ValidateBases(obj) {
        for (let i = 0; i < obj.bases.length; ++i) {
            const topLeft = obj.bases[i].topLeft;
            const bottomRight = obj.bases[i].bottomRight;

            if (!(ValidateNotNegativeNumber(topLeft.x, "topLeft.x") && ValidateNotNegativeNumber(topLeft.y, "topLeft.y") &&
                    ValidateNotNegativeNumber(bottomRight.x, "bottomRight.x") && ValidateNotNegativeNumber(bottomRight.y, "bottomRight.y"))) {
                return false;
            }

            if (topLeft.x > bottomRight.x) {
                alert("base #" + i + " topLeft.x>bottomRight.x");
                return false;
            }
            if (topLeft.y > bottomRight.y) {
                alert("base #" + i + " topLeft.y>bottomRight.y");
                return false;
            }
        }

        return true;
    }

    static ValidateStartSnowMap(obj) {
        if (typeof obj.startSnowMap === "number") {
            return ValidateNotNegativeNumber(obj.startSnowMap, "obj.startSnowMap");
        }

        if (typeof obj.startSnowMap === "object") {
            const width = obj.width * 1;
            const height = obj.height * 1;

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
                    if (!ValidateNotNegativeNumber(obj.startSnowMap[h][w], "startSnowMap " + w + " " + h)) {
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
        return ValidateNotNegativeNumber(obj.lastSnowIncreaseStep, "lastSnowIncreaseStep");
    }

    static ValidateSnowIncreaseValue(obj) {
        if (typeof obj.snowIncreaseValue === "number") {
            return ValidateNotNegativeNumber(obj.snowIncreaseValue, "obj.snowIncreaseValue");
        }

        if (typeof obj.snowIncreaseValue === "object") {
            const width = obj.width * 1;
            const height = obj.height * 1;

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
                    if (!ValidateNotNegativeNumber(obj.snowIncreaseValue[h][w], "snowIncreaseValue " + w + " " + h)) {
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
        const obj = JSON.parse(json);
        return {
            valid: MapInfo.ValidateSize(obj) &&
                MapInfo.ValidateMap(obj) &&
                MapInfo.ValidateTurns(obj) &&
                MapInfo.ValidateSpawns(obj) &&
                MapInfo.ValidateBases(obj) &&
                MapInfo.ValidateStartSnowMap(obj) &&
                MapInfo.ValidateSnowIncreasePeriod(obj) &&
                MapInfo.ValidateLastSnowIncreaseStep(obj) &&
                MapInfo.ValidateSnowIncreaseValue(obj),
            object: obj
        }
    }

    static LoadMapFromJson(json) {
        let obj = null;
        if (typeof json === 'string') {
            const res = MapInfo.IsJsonValid(json);
            if (!res.valid) {
                alert("Json is invalide")
                return;
            }
            obj = res.object;
        } else {
            obj = json;
        }

        const width = obj.width * 1;
        const height = obj.height * 1;

        const map = [];
        for (let h = 0; h < height; ++h) {
            map[h] = []
            for (let w = 0; w < width; ++w) {
                map[h][w] = this.MapCharToGameObject(obj.map[h][w]);
                if (map[h][w].constructor.name === "Field") {
                    map[h][w].SetSnowCount(typeof obj.startSnowMap === "number" ? obj.startSnowMap : obj.startSnowMap[h][w])
                }
            }
        }

        const spawns = [];
        for (let i = 0; i < obj.spawns.length; ++i) {
            spawns.push({ x: obj.spawns[i].x, y: obj.spawns[i].y });
        }

        const bases = []
        for (let i = 0; i < obj.bases.length; ++i) {
            let topLeft = obj.bases[i].topLeft;
            let bottomRight = obj.bases[i].bottomRight;
            bases.push(new PlayerBase({ x: topLeft.x, y: topLeft.y }, { x: bottomRight.x, y: bottomRight.y }))
        }

        const turns = obj.turns * 1;

        return new MapInfo(width, height, map, spawns, bases, turns, obj.snowIncreasePeriod, obj.lastSnowIncreaseStep, obj.snowIncreaseValue, obj.startSnowMap);
    }
}

class Scene {

    static moves = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: 0 }];

    constructor(mapInfo, bots, isAsyncBotsInit = false, timeout = 10, onComplete = null, isBotInit = true, isShortLogs = false, isStoreControllersText = true) {
        this.mapInfo = mapInfo;
        this.bots = bots;
        this.snowballs = [];
        this.startTurnsCount = this.mapInfo.turns;
        this.snowLevelMapBeforeIncrease = this.GetSnowLevelMap();

        if (this.bots.length > mapInfo.spawns.length) {
            throw "Spawns not enough";
        }

        const spawns = mapInfo.spawns.slice();
        this.dynamicLayer = [];
        const map = this.mapInfo.map;
        for (let h = 0; h < map.length; ++h) {
            this.dynamicLayer[h] = []
            for (let w = 0; w < map[h].length; ++w) {
                this.dynamicLayer[h][w] = null;
            }
        }

        for (let i = 0; i < this.bots.length; ++i) {
            const bot = this.bots[i];
            bot.x = spawns[i].x * 1;
            bot.y = spawns[i].y * 1;
            this.dynamicLayer[bot.y][bot.x] = bot;
        }

        this.logs = {
            mapStartState: this.mapInfo.GetSafeMapInfo(),
            startBotsInfo: this.GetSafeBotInfo(true, false, isStoreControllersText),
            turns: [],
            isStoreControllersText: isStoreControllersText,
            isShort: isShortLogs,
        };

        if (isBotInit) {
            if (isAsyncBotsInit) {
                this.AsyncBotsInit(timeout, onComplete);
            } else {
                this.InitBots();
                this.AddTurnToLogs();
            }
        }
    }

    GetSafeBotInfo(isFull = true, onlyDir = false, isStoreControllersText = true) {
        const bots = [];
        for (let i = 0; i < this.bots.length; ++i) {
            const bot = this.bots[i];
            if (!onlyDir) {
                const obj = {
                    index: i,
                    id: bot.id,
                    name: bot.name,
                    x: bot.x,
                    y: bot.y,
                    dir: bot.dir,
                    controller: Clone(bot.controller.controllerObj),
                    state: bot.GetState()
                };
                if (isFull) {
                    obj.color = bot.color;
                    if (isStoreControllersText)
                        obj.controllerText = bot.controller.text;
                }
                bots.push(obj);
            } else {
                bots.push({ dir: bot.dir, state: bot.GetState() });
            }
        }

        return bots;
    }

    GetSafeSnowballsInfo() {
        const snowballs = []
        for (let i = 0; i < this.snowballs.length; ++i) {
            snowballs.push({
                x: this.snowballs[i].x,
                y: this.snowballs[i].y,
                value: this.snowballs[i].currentSnowCount,
                id: this.snowballs[i].id
            })
        }

        return snowballs;
    }

    AddTurnToLogs() {
        const turn = { botsInfo: this.GetSafeBotInfo(false, this.logs.isShort, this.logs.isStoreControllersText) };
        if (!this.logs.isShort) {
            turn.snowLevelMapBeforeIncrease = this.snowLevelMapBeforeIncrease;
            turn.snowLevelMap = this.GetSnowLevelMap();
            turn.snowballs = this.GetSafeSnowballsInfo();
            turn.scores = this.CalcScores();
        }
        this.logs.turns.push(turn);
        this.logs.lastCalcScore = this.CalcScores();
    }

    GetLogs() {
        return JSON.stringify(this.logs);
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
            InitBot(i);
        }
    }

    InitBot(botIndex) {
        this.bots[botIndex].controller.controllerObj.Init({ mapInfo: this.mapInfo.GetSafeMapInfo(), index: i });
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

        MakeWorkerForInit(
            scene.bots[botIndex].controller, { mapInfo: scene.mapInfo.GetSafeMapInfo(), index: botIndex },
            timeout,
            function next(worker, result) {
                worker.terminate();
                if (result.complete) {
                    CopyDataToObject(result.controller.controllerObj, scene.bots[botIndex].controller.controllerObj);
                    scene.bots[botIndex].SetState("ok");
                } else {
                    console.log("bot #" + botIndex + " init unsuccessful");
                    scene.bots[botIndex].SetState("tl");
                }

                if (botIndex + 1 === scene.bots.length) {
                    if (onComplete !== null && onComplete !== undefined) {
                        scene.AddTurnToLogs();
                        onComplete();
                    }
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

    GetSnowLevelMap() {
        const snowLevelMap = [];
        for (let h = 0; h < this.mapInfo.height; ++h) {
            snowLevelMap[h] = [];
            for (let w = 0; w < this.mapInfo.width; ++w) {
                if (this.mapInfo.map[h][w].constructor.name === "Field") {
                    snowLevelMap[h][w] = this.mapInfo.map[h][w].currentSnowCount;
                } else {
                    snowLevelMap[h][w] = 0;
                }
            }
        }

        return snowLevelMap;
    }

    PrepareDataForController(botIndex) {
        const enemies = [];
        for (let i = 0; i < this.bots.length; ++i) {
            if (i != botIndex) {
                enemies.push({
                    x: this.bots[i].x,
                    y: this.bots[i].y,
                    name: this.bots[i].name,
                })
            }
        }

        return new SceneInfoForController({ x: this.bots[botIndex].x, y: this.bots[botIndex].y }, enemies, this.GetSafeSnowballsInfo(), this.GetSnowLevelMap());
    }

    UpdateDynamicLayerAfterBotChooseDirection(botIndex, dir, state = "ok") {
        this.bots[botIndex].SetDirAndAnim(dir);
        this.bots[botIndex].SetState(state);

        const newY = this.bots[botIndex].y + Scene.moves[dir].y;
        const newX = this.bots[botIndex].x + Scene.moves[dir].x;

        if (newX < 0 || newX >= this.mapInfo.width || newY < 0 || newY >= this.mapInfo.height) {
            console.log("bot index:" + botIndex + "tried get out of bounds");
            return;
        }

        const afterY = newY + Scene.moves[dir].y;
        const afterX = newX + Scene.moves[dir].x;

        const map = this.mapInfo.map;
        if (map[newY][newX].constructor.name === "Field") {
            if (this.dynamicLayer[newY][newX] == null) {
                if ((afterX > 0 && afterX < this.mapInfo.width && afterY > 0 && afterY < this.mapInfo.height) &&
                    (map[afterY][afterX].constructor.name === "Field" && this.dynamicLayer[afterY][afterX] == null)) {
                    if (map[newY][newX].GetSnowCount() + map[newY][newX].GetSnowCount() > 0) {
                        const snowball = new Snowball(afterX, afterY, dir);
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
                        const snowball = this.dynamicLayer[newY][newX];
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
        this.snowLevelMapBeforeIncrease = this.GetSnowLevelMap();
        const map = this.mapInfo.map;
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
        const scores = [];
        for (let i = 0; i < this.bots.length; ++i) {
            scores[i] = { value: 0, botName: this.bots[i].name, botColor: this.bots[i].color, state: this.bots[i].GetState() };
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
        const map = this.mapInfo.map;
        canvas.width = map[0].length * tileSize;
        canvas.height = map.length * tileSize;
        const context = canvas.getContext('2d');
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                context.drawImage(map[h][w].texture, w * tileSize, h * tileSize, tileSize, tileSize);
            }
        }

        if (this.bots.length > 0) {
            for (let i = 0; i < this.bots.length; ++i) {
                const topLeft = this.mapInfo.bases[i].topLeft;
                const bottomRight = this.mapInfo.bases[i].bottomRight;
                context.beginPath();
                context.rect(topLeft.x * tileSize, topLeft.y * tileSize, (bottomRight.x - topLeft.x + 1) * tileSize, (bottomRight.y - topLeft.y + 1) * tileSize);
                context.fillStyle = this.bots[i].color;
                context.fillStyle = HexToRgbA(context.fillStyle, 0.3);
                context.fill();
            }
        } else {
            for (let i = 0; i < this.mapInfo.bases.length; ++i) {
                const topLeft = this.mapInfo.bases[i].topLeft;
                const bottomRight = this.mapInfo.bases[i].bottomRight;
                context.beginPath();
                context.rect(topLeft.x * tileSize, topLeft.y * tileSize, (bottomRight.x - topLeft.x + 1) * tileSize, (bottomRight.y - topLeft.y + 1) * tileSize);
                context.fillStyle = colors[i];
                context.fill();
            }
        }

        for (let i = 0; i < this.snowballs.length; ++i) {
            const snowball = this.snowballs[i];
            context.drawImage(snowball.texture, snowball.x * tileSize, snowball.y * tileSize, tileSize, tileSize);
        }

        for (let i = 0; i < this.bots.length; ++i) {
            const bot = this.bots[i];
            context.beginPath();
            context.drawImage(bot.texture, bot.x * tileSize, bot.y * tileSize, tileSize, tileSize);
            DrawText(context, bot.name, bot.x, bot.y, tileSize)
        }

        if (this.bots.length === 0) {
            this.DrawSpawns(context, tileSize);
        }
    }

    DrawSpawns(context, tileSize) {
        for (let i = 0; i < this.mapInfo.spawns.length; ++i) {
            const spawn = this.mapInfo.spawns[i];
            DrawText(context, "sp " + i, spawn.x, spawn.y, tileSize, tileSize / 2);
            context.beginPath();
            context.rect(spawn.x * tileSize, spawn.y * tileSize, tileSize, tileSize);
            context.strokeStyle = "black";
            context.lineWidth = 2;
            context.stroke();
        }
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
            let state = "ok";
            let dir = this.bots[i].controller.controllerObj.GetDirection(this.PrepareDataForController(i));
            if (!(dir === 0 || dir === 1 || dir === 2 || dir === 3 || dir === 4)) {
                console.warn("bad direction format " + this.bots[i].name);
                dir = 4;
                state = "tl";
            }
            this.UpdateDynamicLayerAfterBotChooseDirection(i, dir, state);
        }

        this.UpdateSnowOnFileds();
        this.AddTurnToLogs();
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
        MakeWorkerForGetDirection(
            scene.bots[botIndex].controller,
            scene.PrepareDataForController(botIndex),
            timeout,
            function next(worker, result) {
                worker.terminate();
                if ((result.dir === 0 || result.dir === 1 || result.dir === 2 || result.dir === 3 || result.dir === 4)) {
                    CopyDataToObject(result.controller.controllerObj, scene.bots[botIndex].controller.controllerObj);
                    scene.UpdateDynamicLayerAfterBotChooseDirection(botIndex, result.dir, "ok");
                } else {
                    console.warn("bot #" + botIndex + "wrong dir format");
                    scene.UpdateDynamicLayerAfterBotChooseDirection(botIndex, 4, "tl")
                }

                if (botIndex + 1 === scene.bots.length) {
                    scene.UpdateSnowOnFileds();
                    scene.AddTurnToLogs();
                    if (onComplete !== null && onComplete !== undefined)
                        onComplete(scene.CalcScores());
                } else {
                    scene.IterateAsyncStep(timeout, botIndex + 1, onComplete)
                }
            }
        );
    }
}

function DrawText(context, text, x, y, tileSize, verticalOffset = null) {
    let maxTextHeigth = tileSize / 3;

    context.beginPath();
    let height = tileSize / 10;
    context.font = "normal " + height + "px Verdana";
    let width = context.measureText(text).width;

    height *= tileSize / width;
    height = Math.min(height, maxTextHeigth);
    width = tileSize;

    context.font = "normal " + height + "px Verdana";
    context.fillStyle = "orange";

    if (verticalOffset === null)
        verticalOffset = height / 4;

    let realWidth = context.measureText(text).width;
    context.fillText(text, x * tileSize + (tileSize - realWidth) / 2, y * tileSize + verticalOffset, width);
}